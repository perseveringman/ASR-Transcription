import { Plugin, Notice, TFile, TAbstractFile, moment, Menu } from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings } from './types/config';
import { ASRSettingTab } from './ui/settings-tab';
import { AudioRecorder } from './services/audio-recorder';
import { RecordingModal } from './ui/recording-view';
import { TranscriptionServiceFactory } from './services/transcription/factory';
import { TextInserter } from './services/text-inserter';
import { VaultUtils } from './utils/vault-utils';
import { AudioSelectionModal } from './ui/audio-selection-modal';
import { AudioConverter } from './services/audio-converter';

export default class ASRPlugin extends Plugin {
    settings!: PluginSettings;
    recorder!: AudioRecorder;
    textInserter!: TextInserter;

    async onload() {
        await this.loadSettings();

        this.recorder = new AudioRecorder();
        this.textInserter = new TextInserter(this.app, this.settings);

        // This adds a settings tab so the user can configure various aspects of the plugin
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

    /**
     * Check if a file is an audio file based on its extension
     */
    private isAudioFile(file: TFile): boolean {
        const audioExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac'];
        return audioExtensions.includes(file.extension.toLowerCase());
    }

    /**
     * Unified transcription processing logic
     * Handles chunking based on service constraints and result aggregation
     */
    private async processTranscription(audio: Blob | TFile): Promise<string> {
        const transcriptionService = TranscriptionServiceFactory.create(this.settings);
        const constraints = transcriptionService.getConstraints();
        const notice = new Notice(`Preparing transcription...`, 0);

        try {
            let arrayBuffer: ArrayBuffer;
            let blob: Blob;
            let extension = '';

            if (audio instanceof TFile) {
                arrayBuffer = await this.app.vault.readBinary(audio);
                extension = audio.extension.toLowerCase();
                blob = new Blob([arrayBuffer], { type: this.getMimeType(audio) });
            } else {
                arrayBuffer = await audio.arrayBuffer();
                blob = audio;
                if (audio instanceof File) {
                    extension = audio.name.split('.').pop()?.toLowerCase() || '';
                } else {
                    extension = blob.type.includes('wav') ? 'wav' : (blob.type.includes('mp4') || blob.type.includes('m4a') ? 'm4a' : 'mp3');
                }
            }
            
            // Check duration for chunking
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const audioContext = new AudioContextClass();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0)); 
            const duration = audioBuffer.duration;
            await audioContext.close();

            let fullText = '';

            // Chunk if duration or size exceeds limits
            const needsChunking = duration > constraints.maxDurationSeconds || blob.size > constraints.maxFileSizeBytes;

            if (needsChunking) {
                notice.setMessage(`Splitting audio into chunks...`);
                // Use the smaller of the two constraints to be safe
                const chunkDuration = Math.min(constraints.maxDurationSeconds, 30); // Default to 30s if max is huge, for progress feedback
                const chunks = await AudioConverter.splitAndConvert(blob, chunkDuration);
                
                for (let i = 0; i < chunks.length; i++) {
                    notice.setMessage(`Transcribing: chunk ${i + 1}/${chunks.length}...`);
                    const result = await transcriptionService.transcribe(chunks[i]);
                    fullText += (fullText ? ' ' : '') + result.text.trim();
                }
            } else {
                let audioToUpload = blob;
                
                if (extension === 'm4a') {
                    notice.setMessage(`Converting to WAV...`);
                    audioToUpload = await AudioConverter.convertToWav(blob);
                }

                const result = await transcriptionService.transcribe(audioToUpload);
                fullText = result.text;
            }

            notice.hide();
            return fullText;
        } catch (err: unknown) {
            notice.hide();
            throw err;
        }
    }

    /**
     * Handle transcription of an audio file from context menu
     * Always creates a new note with the transcription
     */
    async handleAudioFileTranscription(file: TFile) {
        try {
            const fullText = await this.processTranscription(file);
            await this.createTranscriptionNote(fullText, file);
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

            // 2. Process transcription
            const fullText = await this.processTranscription(audio);

            await this.textInserter.insert(fullText, audioFile || undefined);
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
            const fullText = await this.processTranscription(file);
            await this.textInserter.insert(fullText, file);
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
    private async createTranscriptionNote(text: string, audioFile: TFile) {
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
                content = this.applyTemplate(templateContent, text, audioFile);
            } else {
                // Template not found, fallback to formatted text
                console.warn(`[ASR Plugin] Template file not found at path: ${templatePath}`);
                content = this.formatTranscriptionText(text, audioFile);
            }
        } else {
            content = this.formatTranscriptionText(text, audioFile);
        }

        const noteFile = await this.app.vault.create(path, content);
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(noteFile);
    }

    /**
     * Format transcription text with audio link and optional timestamp/separator
     */
    private formatTranscriptionText(text: string, audioFile?: TFile): string {
        let result = text.trim();

        if (this.settings.addTimestamp) {
            const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
            result = `[${timestamp}] ${result}`;
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
    private applyTemplate(template: string, transcription: string, audioFile?: TFile): string {
        const now = moment();
        const vars: Record<string, string> = {
            '{{date}}': now.format('YYYY-MM-DD'),
            '{{time}}': now.format('HH:mm:ss'),
            '{{datetime}}': now.format('YYYY-MM-DD HH:mm:ss'),
            '{{transcription}}': transcription,
            '{{content}}': transcription,
            '{{text}}': transcription,
            '{{audio}}': audioFile ? `![[${audioFile.path}]]` : '',
            '{{audio_link}}': audioFile ? `![[${audioFile.path}]]` : ''
        };

        let result = template;
        for (const [key, value] of Object.entries(vars)) {
            result = result.replace(new RegExp(key, 'g'), value);
        }
        return result;
    }

    private getMimeType(file: TFile): string {
        switch (file.extension.toLowerCase()) {
            case 'mp3': return 'audio/mpeg';
            case 'wav': return 'audio/wav';
            case 'm4a': return 'audio/mp4';
            case 'ogg': return 'audio/ogg';
            case 'webm': return 'audio/webm';
            default: return 'application/octet-stream';
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
        // Refresh text inserter settings
        this.textInserter = new TextInserter(this.app, this.settings);
    }
}
