export interface VolcengineFlashResponse {
    audio_info?: {
        duration: number;
    };
    result: {
        text: string;
        utterances?: Array<{
            text: string;
            start_time: number;
            end_time: number;
            words?: Array<{
                text: string;
                start_time: number;
                end_time: number;
                confidence: number;
            }>;
        }>;
    };
}

export interface VolcengineErrorResponse {
    // Volcengine uses headers for status code/message in some cases,
    // but may also have a body for some errors.
    message?: string;
    code?: number;
}
