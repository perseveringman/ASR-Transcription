import { Plugin, Notice, TFile, TAbstractFile, moment, Menu } from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings } from './types/config';
import { ASRSettingTab } from './ui/settings-tab';
import { AudioRecorder } from './services/audio-recorder';
import { RecordingModal } from './ui/recording-view';
import { TextInserter } from './services/text-inserter';
import { VaultUtils } from './utils/vault-utils';
import { AudioSelectionModal } from './ui/audio-selection-modal';
import { TranscriptionManager } from './managers/transcription-manager';
import { LLMManager } from './managers/llm-manager';

export default class ASRPlugin extends Plugin {
    settings!: PluginSettings;
    recorder!: AudioRecorder;
    textInserter!: TextInserter;
    transcriptionManager!: TranscriptionManager;
    llmManager!: LLMManager;

    async onload() {
        await this.loadSettings();

        this.recorder = new AudioRecorder();
        this.textInserter = new TextInserter(this.app, this.settings);
        this.transcriptionManager = new TranscriptionManager(this.settings);
        this.llmManager = new LLMManager(this.settings);

        this.addSettingTab(new ASRSettingTab(this.app, this));

        // Register commands
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

    private isAudioFile(file: TFile): boolean {
        const audioExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac'];
        return audioExtensions.includes(file.extension.toLowerCase());
    }

    /**
     * Handle transcription of an audio file from context menu
     * Always creates a new note with the transcription
     */
    async handleAudioFileTranscription(file: TFile) {
        try {
            const fullText = await this.transcriptionManager.transcribe(file, this.app);
            const aiText = await this.llmManager.polish(fullText);
            await this.createTranscriptionNote(fullText, file, aiText);
            new Notice(`Transcription of ${file.name} complete!`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            new Notice(`Transcription of ${file.name} failed: ${message}`);
            console.error('ASR Plugin error:', err);
        }
    }

    async handleTranscription(audio: Blob | File) {
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
                aiText = await this.llmManager.polish(fullText);
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

    /**
     * Create a new note with transcription content
     */
    private async createTranscriptionNote(text: string, audioFile: TFile, aiText?: string) {
        const folder = this.settings.voiceNoteFolder || '/';
        const timestamp = moment().format('YYYYMMDD-HHmmss');
        const filename = `Transcription-${timestamp}.md`;
        const path = folder === '/' ? filename : `${folder}/${filename}`;

        // Ensure folder exists
        if (folder !== '/') {
            const folderExists = await this.app.vault.adapter.exists(folder);
            if (!folderExists) {
                await this.app.vault.createFolder(folder);
            }
        }

        let content: string;
        let templatePath = this.settings.templatePath?.trim();
        
        if (templatePath) {
            // Auto-add .md extension if missing
            if (!templatePath.endsWith('.md')) {
                templatePath = templatePath + '.md';
            }
            
            const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
            
            if (templateFile instanceof TFile) {
                const templateContent = await this.app.vault.read(templateFile);
                content = this.applyTemplate(templateContent, text, audioFile, aiText);
            } else {
                // Template not found, fallback to formatted text
                console.warn(`[ASR Plugin] Template file not found at path: ${templatePath}`);
                content = this.formatTranscriptionText(text, audioFile, aiText);
            }
        } else {
            content = this.formatTranscriptionText(text, audioFile, aiText);
        }

        const noteFile = await this.app.vault.create(path, content);
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(noteFile);
    }

    /**
     * Format transcription text with audio link and optional timestamp/separator
     */
    private formatTranscriptionText(text: string, audioFile?: TFile, aiText?: string): string {
        let result = text.trim();

        if (this.settings.addTimestamp) {
            const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
            result = `[${timestamp}] ${result}`;
        }
        
        if (aiText) {
            result += `\n\n> [!AI] AI Polish\n> ${aiText.trim()}`;
        }

        if (audioFile) {
            result = `![[${audioFile.path}]]\n${result}`;
        }

        if (this.settings.addSeparator) {
            result = `---\n${result}\n`;
        } else {
            result = `${result}\n`;
        }

        return result;
    }

    /**
     * Apply template variables to template content
     */
    private applyTemplate(template: string, transcription: string, audioFile?: TFile, aiText?: string): string {
        const now = moment();
        const vars: Record<string, string> = {
            '{{date}}': now.format('YYYY-MM-DD'),
            '{{time}}': now.format('HH:mm:ss'),
            '{{datetime}}': now.format('YYYY-MM-DD HH:mm:ss'),
            '{{transcription}}': transcription,
            '{{content}}': transcription,
            '{{text}}': transcription,
            '{{audio}}': audioFile ? `![[${audioFile.path}]]` : '',
            '{{audio_link}}': audioFile ? `![[${audioFile.path}]]` : '',
            '{{aiText}}': aiText || ''
        };

        let result = template;
        for (const [key, value] of Object.entries(vars)) {
            // Replace all occurrences
            result = result.split(key).join(value);
        }
        return result;
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
        this.textInserter = new TextInserter(this.app, this.settings);
    }
}
