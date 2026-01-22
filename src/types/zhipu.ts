export interface ZhipuTranscriptionResponse {
    text: string;
    request_id: string;
    model: string;
    task_status: string;
}

export interface ZhipuErrorResponse {
    error: {
        code: string;
        message: string;
    };
}
