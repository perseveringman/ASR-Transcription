import { Plugin, Notice, MarkdownView, TFile } from 'obsidian';
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
                    this.handleFileTranscription(audioFiles[0]);
                } else {
                    new AudioSelectionModal(this.app, audioFiles, (file) => {
                        this.handleFileTranscription(file);
                    }).open();
                }
                return true;
            }
        });

        this.addCommand({
            id: 'start-recording',
            name: 'Start recording',
            callback: () => {
                this.recorder.start().catch((err: any) => new Notice(`Failed to start recording: ${err.message}`));
            }
        });

        this.addCommand({
            id: 'stop-recording',
            name: 'Stop recording',
            callback: () => {
                this.recorder.stop();
            }
        });
    }

    async handleTranscription(audio: Blob | File) {
        const transcriptionService = TranscriptionServiceFactory.create(this.settings);
        const notice = new Notice('Transcribing audio...', 0);

        try {
            let audioToUpload = audio;
            const isM4A = audio.type.includes('m4a') || audio.type.includes('mp4') || (audio instanceof File && audio.name.endsWith('.m4a'));
            
            if (isM4A) {
                notice.setMessage('Converting m4a to WAV for compatibility...');
                audioToUpload = await AudioConverter.convertToWav(audio);
            }

            const result = await transcriptionService.transcribe(audioToUpload);
            await this.textInserter.insert(result.text);
            notice.hide();
            new Notice('Transcription complete!');
        } catch (err: any) {
            notice.hide();
            new Notice(`Transcription failed: ${err.message}`);
            console.error('ASR Plugin error:', err);
        }
    }

    async handleFileTranscription(file: TFile) {
        const transcriptionService = TranscriptionServiceFactory.create(this.settings);
        const notice = new Notice(`Transcribing ${file.name}...`, 0);

        try {
            const arrayBuffer = await this.app.vault.readBinary(file);
            let blob = new Blob([arrayBuffer], { type: this.getMimeType(file) });
            
            if (file.extension.toLowerCase() === 'm4a') {
                notice.setMessage(`Converting ${file.name} to WAV...`);
                blob = await AudioConverter.convertToWav(blob);
            }

            const result = await transcriptionService.transcribe(blob);
            await this.textInserter.insert(result.text, file);
            notice.hide();
            new Notice(`Transcription of ${file.name} complete!`);
        } catch (err: any) {
            notice.hide();
            new Notice(`Transcription of ${file.name} failed: ${err.message}`);
            console.error('ASR Plugin error:', err);
        }
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
