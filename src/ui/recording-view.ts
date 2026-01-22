import { App, Modal, Notice } from 'obsidian';
import { AudioRecorder } from '../services/audio-recorder';
import { RecordingState } from '../types/audio';

export class RecordingModal extends Modal {
    private recorder: AudioRecorder;
    private statusEl!: HTMLElement;
    private timerEl!: HTMLElement;
    private startStopBtn!: HTMLButtonElement;
    private uploadBtn!: HTMLButtonElement;

    private handlers: { [key: string]: any } = {};

    constructor(app: App, recorder: AudioRecorder, private onRecordingComplete: (blob: Blob) => Promise<void>) {
        super(app);
        this.recorder = recorder;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('asr-recording-modal');

        contentEl.createEl('h2', { text: 'Voice Transcription' });

        this.statusEl = contentEl.createEl('div', { text: 'Ready to record', cls: 'asr-status' });
        this.timerEl = contentEl.createEl('div', { text: '00:00', cls: 'asr-timer' });

        const btnContainer = contentEl.createEl('div', { cls: 'asr-btn-container' });

        this.startStopBtn = btnContainer.createEl('button', {
            text: 'Start Recording',
            cls: 'mod-cta'
        });

        this.startStopBtn.onclick = () => {
            if (this.recorder.getState() === RecordingState.IDLE) {
                this.startRecording();
            } else if (this.recorder.getState() === RecordingState.RECORDING) {
                this.stopRecording();
            }
        };

        this.uploadBtn = btnContainer.createEl('button', {
            text: 'Upload File',
        });

        this.uploadBtn.onclick = () => {
            this.triggerFileUpload();
        };

        // Define handlers
        this.handlers['statechange'] = (state: any) => this.updateUI(state);
        this.handlers['durationchange'] = (seconds: any) => this.updateTimer(seconds);
        this.handlers['recorded'] = async (blob: any) => {
            await this.onRecordingComplete(blob);
            this.close();
        };
        this.handlers['error'] = (err: any) => {
            new Notice(`Recording error: ${err}`);
            this.updateUI(RecordingState.IDLE);
        };

        // Listen to recorder events
        this.recorder.on('statechange', this.handlers['statechange']);
        this.recorder.on('durationchange', this.handlers['durationchange']);
        this.recorder.on('recorded', this.handlers['recorded']);
        this.recorder.on('error', this.handlers['error']);

        this.updateUI(this.recorder.getState());
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        // Stop recording if modal is closed
        if (this.recorder.getState() === RecordingState.RECORDING) {
            this.recorder.stop();
        }
        // Remove listeners
        this.recorder.off('statechange', this.handlers['statechange']);
        this.recorder.off('durationchange', this.handlers['durationchange']);
        this.recorder.off('recorded', this.handlers['recorded']);
        this.recorder.off('error', this.handlers['error']);
    }

    private async startRecording() {
        try {
            await this.recorder.start();
        } catch (err: any) {
            new Notice(`Failed to start recording: ${err.message}`);
        }
    }

    private stopRecording() {
        this.recorder.stop();
    }

    private triggerFileUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/wav,audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 25 * 1024 * 1024) {
                    new Notice('File too large (max 25MB)');
                    return;
                }
                await this.onRecordingComplete(file);
                this.close();
            }
        };
        input.click();
    }

    private updateUI(state: RecordingState) {
        if (!this.statusEl) return;

        switch (state) {
            case RecordingState.IDLE:
                this.statusEl.setText('Ready to record');
                this.startStopBtn.setText('Start Recording');
                this.startStopBtn.disabled = false;
                this.uploadBtn.disabled = false;
                break;
            case RecordingState.RECORDING:
                this.statusEl.setText('Recording...');
                this.startStopBtn.setText('Stop Recording');
                this.startStopBtn.disabled = false;
                this.uploadBtn.disabled = true;
                break;
            case RecordingState.PROCESSING:
                this.statusEl.setText('Processing...');
                this.startStopBtn.disabled = true;
                this.uploadBtn.disabled = true;
                break;
        }
    }

    private updateTimer(seconds: number) {
        if (!this.timerEl) return;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        this.timerEl.setText(`${mins}:${secs}`);
        
        if (seconds >= 25) {
            this.timerEl.addClass('asr-timer-warning');
        } else {
            this.timerEl.removeClass('asr-timer-warning');
        }
    }
}
