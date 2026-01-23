import { Plugin, Notice, MarkdownView, TFile, moment } from 'obsidian';
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

            // 2. Process transcription (rest of the logic)
            const arrayBuffer = await audio.arrayBuffer();
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const duration = audioBuffer.duration;
            await audioContext.close();

            let fullText = '';
            
            if (duration > 30) {
                notice.setMessage(`Splitting audio into chunks...`);
                const chunks = await AudioConverter.splitAndConvert(audio, 30);
                
                for (let i = 0; i < chunks.length; i++) {
                    notice.setMessage(`Transcribing chunk ${i + 1} of ${chunks.length}...`);
                    const result = await transcriptionService.transcribe(chunks[i]);
                    fullText += (fullText ? ' ' : '') + result.text.trim();
                }
            } else {
                let audioToUpload = audio;
                const isM4A = audio.type.includes('m4a') || audio.type.includes('mp4') || (audio instanceof File && audio.name.endsWith('.m4a'));
                
                if (isM4A) {
                    notice.setMessage('Converting m4a to WAV...');
                    audioToUpload = await AudioConverter.convertToWav(audio);
                }
                
                const result = await transcriptionService.transcribe(audioToUpload);
                fullText = result.text;
            }

            await this.textInserter.insert(fullText, audioFile || undefined);
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
        const notice = new Notice(`Processing ${file.name}...`, 0);

        try {
            const arrayBuffer = await this.app.vault.readBinary(file);
            const blob = new Blob([arrayBuffer], { type: this.getMimeType(file) });
            
            // Check duration
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0)); // Copy buffer as decodeAudioData consumes it
            const duration = audioBuffer.duration;
            await audioContext.close();

            let fullText = '';

            if (duration > 30) {
                notice.setMessage(`Splitting ${file.name} into chunks...`);
                const chunks = await AudioConverter.splitAndConvert(blob, 30);
                
                for (let i = 0; i < chunks.length; i++) {
                    notice.setMessage(`Transcribing ${file.name}: chunk ${i + 1}/${chunks.length}...`);
                    const result = await transcriptionService.transcribe(chunks[i]);
                    fullText += (fullText ? ' ' : '') + result.text.trim();
                }
            } else {
                let blobToUpload = blob;
                if (file.extension.toLowerCase() === 'm4a') {
                    notice.setMessage(`Converting ${file.name} to WAV...`);
                    blobToUpload = await AudioConverter.convertToWav(blob);
                }

                const result = await transcriptionService.transcribe(blobToUpload);
                fullText = result.text;
            }

            await this.textInserter.insert(fullText, file);
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
