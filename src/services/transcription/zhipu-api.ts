import { TranscriptionService, TranscriptionResult, TranscriptionOptions, TranscriptionError, TranscriptionErrorType, TranscriptionConstraints } from '../../types/transcription';
import { ZhipuTranscriptionResponse, ZhipuErrorResponse } from '../../types/zhipu';
import { PluginSettings } from '../../types/config';

export class ZhipuTranscriptionService implements TranscriptionService {
    name = 'zhipu';
    private readonly baseURL = 'https://open.bigmodel.cn/api/paas/v4/audio/transcriptions';

    constructor(private settings: PluginSettings) {}

    async transcribe(audio: File | Blob, options?: TranscriptionOptions): Promise<TranscriptionResult> {
        if (!this.settings.zhipuApiKey) {
            throw new TranscriptionError(
                TranscriptionErrorType.AUTH_ERROR,
                'Zhipu API Key is missing. Please configure it in the settings.'
            );
        }

        const formData = new FormData();
        // Zhipu expects 'file', 'model'
        let filename = audio instanceof File ? audio.name : 'audio.mp3';
        if (audio.type === 'audio/wav' && !filename.endsWith('.wav')) {
            filename = 'audio.wav';
        }
        formData.append('file', audio, filename);
        formData.append('model', 'glm-asr-2512');

        if (this.settings.contextPrompt) {
            formData.append('prompt', this.settings.contextPrompt);
        }

        if (this.settings.hotwords && this.settings.hotwords.length > 0) {
            formData.append('hotwords', JSON.stringify(this.settings.hotwords));
        }

        return this.transcribeWithRetry(formData);
    }

    getConstraints(): TranscriptionConstraints {
        return {
            maxDurationSeconds: 30,
            maxFileSizeBytes: 25 * 1024 * 1024 // 25MB
        };
    }

    private async transcribeWithRetry(formData: FormData, attempt = 0): Promise<TranscriptionResult> {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.zhipuApiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData: ZhipuErrorResponse = await response.json().catch(() => ({}));
                const status = response.status;
                
                if (status === 401) {
                    throw new TranscriptionError(TranscriptionErrorType.AUTH_ERROR, 'Invalid API Key');
                } else if (status === 413) {
                    throw new TranscriptionError(TranscriptionErrorType.FILE_TOO_LARGE, 'Audio file too large (max 25MB)');
                } else if (status >= 500 || status === 429) {
                    // Retriable
                    if (attempt < this.settings.retryCount) {
                        const delay = Math.pow(2, attempt) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return this.transcribeWithRetry(formData, attempt + 1);
                    }
                }
                
                throw new TranscriptionError(
                    TranscriptionErrorType.API_ERROR,
                    errorData.error?.message || `API Error: ${status}`
                );
            }

            const data: ZhipuTranscriptionResponse = await response.json();
            
            return {
                text: data.text,
                requestId: data.request_id,
                model: data.model
            };

        } catch (error: any) {
            if (error instanceof TranscriptionError) {
                throw error;
            }
            
            if (error.name === 'AbortError') {
                throw new TranscriptionError(TranscriptionErrorType.UNKNOWN_ERROR, 'Request timed out');
            }

            throw new TranscriptionError(
                TranscriptionErrorType.NETWORK_ERROR,
                `Network error: ${error.message}`
            );
        }
    }

    supportsStreaming(): boolean {
        return false;
    }
}
