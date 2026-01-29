export enum TranscriptionErrorType {
    NETWORK_ERROR = 'network_error',
    API_ERROR = 'api_error',
    AUTH_ERROR = 'auth_error',
    FILE_TOO_LARGE = 'file_too_large',
    DURATION_TOO_LONG = 'duration_too_long',
    UNSUPPORTED_FORMAT = 'unsupported_format',
    RECORDING_ERROR = 'recording_error',
    UNKNOWN_ERROR = 'unknown_error'
}

export class TranscriptionError extends Error {
    constructor(
        public type: TranscriptionErrorType,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'TranscriptionError';
    }
}

export interface TranscriptionWord {
    text: string;
    startTime: number; // milliseconds
    endTime: number;   // milliseconds
    confidence?: number;
}

export interface TranscriptionUtterance {
    text: string;
    startTime: number; // milliseconds
    endTime: number;   // milliseconds
    speakerId?: number;
    words?: TranscriptionWord[];
}

export interface TranscriptionResult {
    text: string;
    requestId: string;
    model: string;
    duration?: number;
    /** Detailed utterances with timestamps and optional speaker info */
    utterances?: TranscriptionUtterance[];
}

export interface TranscriptionOptions {
    prompt?: string;
    hotwords?: string[];
}

export interface TranscriptionConstraints {
    maxDurationSeconds: number;
    maxFileSizeBytes: number;
}

export interface TranscriptionService {
    name: string;
    transcribe(audio: File | Blob, options?: TranscriptionOptions): Promise<TranscriptionResult>;
    getConstraints(): TranscriptionConstraints;
    supportsStreaming(): boolean;
}
