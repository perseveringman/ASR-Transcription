import { Plugin, Notice, TFile, TAbstractFile, moment, Menu, MarkdownView, Editor } from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings } from './types/config';
import { ASRSettingTab } from './ui/settings-tab';
import { AudioRecorder } from './services/audio-recorder';
import { RecordingModal } from './ui/recording-view';
import { TextInserter } from './services/text-inserter';
import { VaultUtils } from './utils/vault-utils';
import { AudioSelectionModal } from './ui/audio-selection-modal';
import { TranscriptionManager } from './managers/transcription-manager';
import { LLMManager } from './managers/llm-manager';
import { ActionManager } from './managers/action-manager';
import { BatchManager } from './managers/batch-manager';
import { TranscriptionNoteService } from './services/transcription-note-service';
import { ArticleReaderManager } from './managers/article-reader-manager';
import { AISidebarView, VIEW_TYPE_AI_SIDEBAR } from './ui/sidebar/sidebar-view';

export default class ASRPlugin extends Plugin {
    settings!: PluginSettings;
    recorder!: AudioRecorder;
    textInserter!: TextInserter;
    transcriptionManager!: TranscriptionManager;
    llmManager!: LLMManager;
    actionManager!: ActionManager;
    batchManager!: BatchManager;
    noteService!: TranscriptionNoteService;
    articleReaderManager!: ArticleReaderManager;

    async onload() {
        await this.loadSettings();

        this.recorder = new AudioRecorder();
        this.textInserter = new TextInserter(this.app, this.settings);
        this.transcriptionManager = new TranscriptionManager(this.settings);
        this.llmManager = new LLMManager(this.settings);
        this.noteService = new TranscriptionNoteService(this.app, this.settings);
        this.actionManager = new ActionManager(this.app, this.llmManager, this.settings, this.saveSettings.bind(this));
        this.batchManager = new BatchManager(this.app, this.settings, this.transcriptionManager, this.llmManager, this.noteService);
        this.articleReaderManager = new ArticleReaderManager(this.app, this.settings, this.llmManager);

        this.addSettingTab(new ASRSettingTab(this.app, this));

        // Register View
        this.registerView(
            VIEW_TYPE_AI_SIDEBAR,
            (leaf) => new AISidebarView(leaf, this.actionManager)
        );

        // Add Ribbon Icon
        this.addRibbonIcon('bot', 'Open AI Actions', () => {
            this.activateView();
        });

        // Register commands
        this.addCommand({
            id: 'open-ai-sidebar',
            name: 'Open AI actions sidebar',
            callback: () => {
                this.activateView();
            }
        });

        this.addCommand({
            id: 'open-asr-modal',
            name: 'Open transcription modal',
            callback: () => {
                new RecordingModal(this.app, this.recorder, this.handleTranscription.bind(this)).open();
            }
        });

        this.addCommand({
            id: 'transcribe-referenced-audio',
            name: 'Transcribe referenced audio in current note',
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile || activeFile.extension !== 'md') return false;
                
                if (checking) return true;

                const audioFiles = VaultUtils.getReferencedAudioFiles(this.app, activeFile);
                if (audioFiles.length === 0) {
                    new Notice('No audio file references found in current note.');
                    return true;
                }

                if (audioFiles.length === 1) {
                    void this.handleFileTranscription(audioFiles[0]);
                } else {
                    new AudioSelectionModal(this.app, audioFiles, (file) => {
                        void this.handleFileTranscription(file);
                    }).open();
                }
                return true;
            }
        });

        this.addCommand({
            id: 'start-recording',
            name: 'Start recording',
            callback: () => {
                void this.recorder.start().catch((err: unknown) => {
                    const message = err instanceof Error ? err.message : String(err);
                    new Notice(`Failed to start recording: ${message}`);
                });
            }
        });

        this.addCommand({
            id: 'stop-recording',
            name: 'Stop recording',
            callback: () => {
                this.recorder.stop();
            }
        });

        this.addCommand({
            id: 'batch-process-todays-audio',
            name: 'Batch process today\'s audio notes',
            callback: () => {
                void this.batchManager.processTodaysAudioFiles();
            }
        });

        this.addCommand({
            id: 'analyze-url-at-cursor',
            name: 'Analyze URL at cursor',
            editorCallback: async (editor: Editor) => {
                await this.handleUrlAtCursor(editor);
            }
        });

        // Register paste event for auto-trigger
        this.registerEvent(
            this.app.workspace.on('editor-paste', (evt: ClipboardEvent, editor: Editor) => {
                if (!this.settings.enableArticleReader || !this.settings.articleReaderAutoTrigger) {
                    return;
                }
                const text = evt.clipboardData?.getData('text/plain');
                if (text) {
                    const url = this.articleReaderManager.extractUrl(text);
                    if (url) {
                        evt.preventDefault();
                        void this.handlePastedUrl(editor, text, url);
                    }
                }
            })
        );

        // Register file menu event for right-click transcription on audio files
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
                if (file instanceof TFile && this.isAudioFile(file)) {
                    menu.addItem((item) => {
                        item
                            .setTitle('Transcribe audio')
                            .setIcon('mic')
                            .onClick(() => {
                                void this.handleAudioFileTranscription(file);
                            });
                    });
                }
            })
        );
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf = workspace.getLeavesOfType(VIEW_TYPE_AI_SIDEBAR)[0];

        if (!leaf) {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                await rightLeaf.setViewState({
                    type: VIEW_TYPE_AI_SIDEBAR,
                    active: true,
                });
                leaf = workspace.getLeavesOfType(VIEW_TYPE_AI_SIDEBAR)[0];
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    private isAudioFile(file: TFile): boolean {
        const audioExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac'];
        return audioExtensions.includes(file.extension.toLowerCase());
    }

    /**
     * Handle URL at cursor position - triggered by command
     */
    async handleUrlAtCursor(editor: Editor) {
        if (!this.settings.enableArticleReader) {
            new Notice('Article reader is disabled. Enable it in settings.');
            return;
        }

        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        const url = this.articleReaderManager.extractUrl(line);

        if (!url) {
            new Notice('No URL found on current line.');
            return;
        }

        try {
            const { link } = await this.articleReaderManager.processUrl(url);
            // Insert link below the URL line
            const lineEnd = { line: cursor.line, ch: line.length };
            editor.replaceRange(`\n${link}`, lineEnd);
        } catch (err) {
            // Error already shown by manager
        }
    }

    /**
     * Handle pasted URL - triggered by paste event
     */
    async handlePastedUrl(editor: Editor, pastedText: string, url: string) {
        // First, insert the pasted URL
        editor.replaceSelection(pastedText);
        const cursor = editor.getCursor();

        try {
            const { link } = await this.articleReaderManager.processUrl(url);
            // Insert link below the pasted URL
            const lineEnd = { line: cursor.line, ch: editor.getLine(cursor.line).length };
            editor.replaceRange(`\n${link}`, lineEnd);
        } catch (err) {
            // Error already shown by manager
        }
    }

    /**
     * Handle transcription of an audio file from context menu
     * Always creates a new note with the transcription
     */
    async handleAudioFileTranscription(file: TFile) {
        try {
            const fullText = await this.transcriptionManager.transcribe(file, this.app);
            const aiText = await this.llmManager.polish(fullText);
            const noteFile = await this.noteService.createTranscriptionNote(fullText, file, aiText);
            
            // Open the new note
            const leaf = this.app.workspace.getLeaf(true);
            await leaf.openFile(noteFile);
            
            new Notice(`Transcription of ${file.name} complete!`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            new Notice(`Transcription of ${file.name} failed: ${message}`);
            console.error('ASR Plugin error:', err);
        }
    }

    async handleTranscription(audio: Blob | File, styleId?: string) {
        const notice = new Notice('Processing audio...', 0);

        try {
            // 1. Save the audio file if it's a new recording (Blob)
            let audioFile: TFile | null = null;
            if (!(audio instanceof File)) {
                const timestamp = moment().format('YYYYMMDD-HHmmss');
                const extension = audio.type.includes('wav') ? 'wav' : 'mp3';
                const fileName = `Recording-${timestamp}.${extension}`;
                const folder = this.settings.audioSaveFolder || '/';
                
                // Ensure folder exists
                if (folder !== '/') {
                    const folderExists = await this.app.vault.adapter.exists(folder);
                    if (!folderExists) {
                        await this.app.vault.createFolder(folder);
                    }
                }
                
                const path = folder === '/' ? fileName : `${folder}/${fileName}`;
                const arrayBuffer = await audio.arrayBuffer();
                audioFile = await this.app.vault.createBinary(path, arrayBuffer);
                new Notice(`Audio saved: ${fileName}`);
            }

            // 2. Process transcription using Manager
            const fullText = await this.transcriptionManager.transcribe(audio, this.app);
            
            // 3. Process AI Polishing using Manager
            let aiText = '';
            try {
                // Pass the selected style ID if available
                aiText = await this.llmManager.polish(fullText, styleId);
            } catch (err: unknown) {
                 const message = err instanceof Error ? err.message : String(err);
                 new Notice(`AI Polishing failed: ${message}`, 5000);
            }

            await this.textInserter.insert(fullText, audioFile || undefined, aiText);
            notice.hide();
            new Notice('Transcription complete!');
        } catch (err: unknown) {
            notice.hide();
            const message = err instanceof Error ? err.message : String(err);
            new Notice(`Transcription failed: ${message}`);
            console.error('ASR Plugin error:', err);
        }
    }

    async handleFileTranscription(file: TFile) {
        try {
            const fullText = await this.transcriptionManager.transcribe(file, this.app);
            
            let aiText = '';
            try {
                aiText = await this.llmManager.polish(fullText);
            } catch (err: unknown) {
                 const message = err instanceof Error ? err.message : String(err);
                 new Notice(`AI Polishing failed: ${message}`, 5000);
            }

            await this.textInserter.insert(fullText, file, aiText);
            new Notice(`Transcription of ${file.name} complete!`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            new Notice(`Transcription of ${file.name} failed: ${message}`);
            console.error('ASR Plugin error:', err);
        }
    }

    onunload() {
        if (this.recorder) {
            this.recorder.stop();
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // Update Managers
        this.transcriptionManager.updateSettings(this.settings);
        this.llmManager.updateSettings(this.settings);
        this.noteService.updateSettings(this.settings);
        this.textInserter = new TextInserter(this.app, this.settings);
        
        // Update action manager if needed
        if (this.actionManager) {
             this.actionManager.updateSettings(this.settings);
        }
        
        // Update article reader manager
        if (this.articleReaderManager) {
            this.articleReaderManager.updateSettings(this.settings);
        }
    }
}
