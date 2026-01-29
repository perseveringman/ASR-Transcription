export interface VolcengineUtterance {
    text: string;
    start_time: number;
    end_time: number;
    speaker_id?: number;
    channel_id?: number;
    words?: Array<{
        text: string;
        start_time: number;
        end_time: number;
        confidence?: number;
        blank_duration?: number;
    }>;
    additions?: {
        speech_rate?: number;
        volume?: number;
        emotion?: string;
        gender?: string;
    };
}

export interface VolcengineFlashResponse {
    audio_info?: {
        duration: number;
    };
    result: {
        text: string;
        utterances?: VolcengineUtterance[];
    };
}

export interface VolcengineErrorResponse {
    // Volcengine uses headers for status code/message in some cases,
    // but may also have a body for some errors.
    message?: string;
    code?: number;
}
