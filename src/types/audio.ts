export enum RecordingState {
    IDLE = 'idle',
    RECORDING = 'recording',
    PAUSED = 'paused',
    PROCESSING = 'processing'
}

export type AudioFormat = 'audio/mp4' | 'audio/webm' | 'audio/wav' | 'audio/mpeg';
