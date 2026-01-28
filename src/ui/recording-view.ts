import { App, Modal, Notice, Setting } from 'obsidian';
import { AudioRecorder } from '../services/audio-recorder';
import { RecordingState } from '../types/audio';
import { DEFAULT_STYLE_PRESETS } from '../types/config';

export class RecordingModal extends Modal {
    private recorder: AudioRecorder;
    private statusEl!: HTMLElement;
    private timerEl!: HTMLElement;
    private startStopBtn!: HTMLButtonElement;
    private uploadBtn!: HTMLButtonElement;
    private styleSelectEl!: HTMLSelectElement;

    private handlers: { [key: string]: (arg: unknown) => void } = {};

    constructor(
        app: App, 
        recorder: AudioRecorder, 
        private onRecordingComplete: (blob: Blob, styleId?: string) => Promise<void>,
        private initialStyleId: string = 'default'
    ) {
        super(app);
        this.recorder = recorder;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('asr-recording-modal');

        contentEl.createEl('h2', { text: 'Voice transcription' });

        this.statusEl = contentEl.createEl('div', { text: 'Ready to record', cls: 'asr-status' });
        this.timerEl = contentEl.createEl('div', { text: '00:00', cls: 'asr-timer' });

        // Style Selector
        const styleContainer = contentEl.createEl('div', { cls: 'asr-style-container' });
        new Setting(styleContainer)
            .setName('Output style')
            .setDesc('How should the AI rewrite this?')
            .addDropdown(dropdown => {
                this.styleSelectEl = dropdown.selectEl;
                DEFAULT_STYLE_PRESETS.forEach(preset => {
                    dropdown.addOption(preset.id, preset.name);
                });
                dropdown.setValue(this.initialStyleId);
            });

        const btnContainer = contentEl.createEl('div', { cls: 'asr-btn-container' });

        this.startStopBtn = btnContainer.createEl('button', {
            text: 'Start recording',
            cls: 'mod-cta'
        });

        this.startStopBtn.onclick = () => {
            if (this.recorder.getState() === RecordingState.IDLE) {
                void this.startRecording();
            } else if (this.recorder.getState() === RecordingState.RECORDING) {
                void this.stopRecording();
            }
        };

        this.uploadBtn = btnContainer.createEl('button', {
            text: 'Upload file',
        });

        this.uploadBtn.onclick = () => {
            this.triggerFileUpload();
        };

        // Define handlers
        this.handlers['statechange'] = (state: unknown) => this.updateUI(state as RecordingState);
        this.handlers['durationchange'] = (seconds: unknown) => this.updateTimer(seconds as number);
        this.handlers['recorded'] = (blob: unknown) => {
            void (async () => {
                const selectedStyle = this.styleSelectEl ? this.styleSelectEl.value : undefined;
                await this.onRecordingComplete(blob as Blob, selectedStyle);
                this.close();
            })();
        };
        this.handlers['error'] = (err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            new Notice(`Recording error: ${message}`);
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
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            new Notice(`Failed to start recording: ${message}`);
        }
    }

    private stopRecording() {
        this.recorder.stop();
    }

    private triggerFileUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/wav,audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a';
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                if (file.size > 25 * 1024 * 1024) {
                    new Notice('File too large (max 25mb)');
                    return;
                }
                const selectedStyle = this.styleSelectEl ? this.styleSelectEl.value : undefined;
                await this.onRecordingComplete(file, selectedStyle);
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
                this.startStopBtn.setText('Start recording');
                this.startStopBtn.disabled = false;
                this.uploadBtn.disabled = false;
                if (this.styleSelectEl) this.styleSelectEl.disabled = false;
                break;
            case RecordingState.RECORDING:
                this.statusEl.setText('Recording...');
                this.startStopBtn.setText('Stop recording');
                this.startStopBtn.disabled = false;
                this.uploadBtn.disabled = true;
                if (this.styleSelectEl) this.styleSelectEl.disabled = true;
                break;
            case RecordingState.PROCESSING:
                this.statusEl.setText('Processing...');
                this.startStopBtn.disabled = true;
                this.uploadBtn.disabled = true;
                if (this.styleSelectEl) this.styleSelectEl.disabled = true;
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
