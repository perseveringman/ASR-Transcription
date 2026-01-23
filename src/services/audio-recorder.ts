import { Events } from 'obsidian';
import { RecordingState } from '../types/audio';

export class AudioRecorder extends Events {
    private mediaRecorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];
    private state: RecordingState = RecordingState.IDLE;
    private startTime: number = 0;
    private timerInterval: number | null = null;

    constructor() {
        super();
    }

    getState(): RecordingState {
        return this.state;
    }

    async start(): Promise<void> {
        if (this.state !== RecordingState.IDLE) {
            throw new Error('Recorder is already busy');
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Try to find a supported mime type
            const mimeType = this.getSupportedMimeType();
            
            this.mediaRecorder = new MediaRecorder(stream, { mimeType });
            this.chunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.handleStop();
            };

            this.mediaRecorder.onerror = (e) => {
                this.trigger('error', e);
            };

            this.mediaRecorder.start();
            this.state = RecordingState.RECORDING;
            this.startTime = Date.now();
            this.trigger('statechange', this.state);

            // Start timer for duration tracking
            this.timerInterval = window.setInterval(() => {
                const duration = Math.floor((Date.now() - this.startTime) / 1000);
                this.trigger('durationchange', duration);
                
                // Auto-stop at 10 minutes (safety limit)
                if (duration >= 600) {
                    this.stop();
                }
            }, 1000);

        } catch (err) {
            this.state = RecordingState.IDLE;
            this.trigger('statechange', this.state);
            throw err;
        }
    }

    stop(): void {
        if (this.mediaRecorder && this.state === RecordingState.RECORDING) {
            this.mediaRecorder.stop();
            // Stop all tracks to release microphone
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    private handleStop(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.state = RecordingState.PROCESSING;
        this.trigger('statechange', this.state);

        const mimeType = this.mediaRecorder?.mimeType || 'audio/wav';
        const blob = new Blob(this.chunks, { type: mimeType });
        
        this.trigger('recorded', blob);
        
        this.state = RecordingState.IDLE;
        this.trigger('statechange', this.state);
    }

    private getSupportedMimeType(): string {
        const types = [
            'audio/mp4',
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/wav'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return '';
    }
}
