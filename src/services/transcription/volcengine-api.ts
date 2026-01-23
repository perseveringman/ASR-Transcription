import { requestUrl } from 'obsidian';
import { TranscriptionService, TranscriptionResult, TranscriptionOptions, TranscriptionError, TranscriptionErrorType, TranscriptionConstraints } from '../../types/transcription';
import { PluginSettings } from '../../types/config';
import { VolcengineFlashResponse } from '../../types/volcengine';

export class VolcengineTranscriptionService implements TranscriptionService {
    name = 'volcengine';
    private readonly submitURL = 'https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit';
    private readonly queryURL = 'https://openspeech.bytedance.com/api/v3/auc/bigmodel/query';

    constructor(private settings: PluginSettings) {}

    async transcribe(audio: File | Blob, options?: TranscriptionOptions): Promise<TranscriptionResult> {
        if (!this.settings.volcengineAppId || !this.settings.volcengineAccessToken) {
            throw new TranscriptionError(
                TranscriptionErrorType.AUTH_ERROR,
                'Volcengine App ID or Access Token is missing. Please configure them in the settings.'
            );
        }

        const base64Data = await this.blobToBase64(audio);
        const requestId = this.generateUUID();

        // Standard Edition (Async)
        const body = {
            user: {
                uid: this.settings.volcengineAppId
            },
            audio: {
                format: this.getAudioFormat(audio),
                data: base64Data // Note: Doc says 'url' is required, but we'll try 'data' as in Flash Edition
            },
            request: {
                model_name: 'bigmodel'
            }
        };

        // 1. Submit task
        await this.submitTask(body, requestId);

        // 2. Poll for result
        return this.pollForResult(requestId);
    }

    private async submitTask(body: Record<string, unknown>, requestId: string, attempt = 0): Promise<void> {
        try {
            const response = await requestUrl({
                url: this.submitURL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-App-Key': this.settings.volcengineAppId,
                    'X-Api-Access-Key': this.settings.volcengineAccessToken,
                    'X-Api-Resource-Id': 'volc.seedasr.auc', // Doubao 2.0 Standard
                    'X-Api-Request-Id': requestId,
                    'X-Api-Sequence': '-1'
                },
                body: JSON.stringify(body)
            });

            const statusCode = response.headers['x-api-status-code'];
            const apiMessage = response.headers['x-api-message'];

            if (statusCode !== '20000000') {
                const status = parseInt(statusCode || '0');
                
                if (status === 55000031 || (status >= 50000000 && status < 60000000)) {
                    if (attempt < this.settings.retryCount) {
                        const delay = Math.pow(2, attempt) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return this.submitTask(body, requestId, attempt + 1);
                    }
                }

                throw new TranscriptionError(
                    TranscriptionErrorType.API_ERROR,
                    apiMessage || `Volcengine Submission Error: ${statusCode}`
                );
            }
        } catch (error: unknown) {
            if (error instanceof TranscriptionError) throw error;
            const message = error instanceof Error ? error.message : String(error);
            throw new TranscriptionError(TranscriptionErrorType.NETWORK_ERROR, `Submission network error: ${message}`);
        }
    }

    private async pollForResult(requestId: string, attempt = 0): Promise<TranscriptionResult> {
        const MAX_POLLING_ATTEMPTS = 60; // 2 minutes with 2s interval
        const POLLING_INTERVAL = 2000;

        for (let i = 0; i < MAX_POLLING_ATTEMPTS; i++) {
            try {
                const response = await requestUrl({
                    url: this.queryURL,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Api-App-Key': this.settings.volcengineAppId,
                        'X-Api-Access-Key': this.settings.volcengineAccessToken,
                        'X-Api-Resource-Id': 'volc.seedasr.auc',
                        'X-Api-Request-Id': requestId
                    },
                    body: JSON.stringify({})
                });

                const statusCode = response.headers['x-api-status-code'];
                const apiMessage = response.headers['x-api-message'];

                if (statusCode === '20000000') {
                    const data: VolcengineFlashResponse = (typeof response.json === 'object' ? response.json : JSON.parse(response.text)) as VolcengineFlashResponse;
                    return {
                        text: data.result.text,
                        requestId: requestId,
                        model: 'doubao-asr-standard',
                        duration: data.audio_info?.duration
                    };
                }

                // 20000001: Processing, 20000002: In queue
                if (statusCode !== '20000001' && statusCode !== '20000002') {
                    throw new TranscriptionError(
                        TranscriptionErrorType.API_ERROR,
                        apiMessage || `Volcengine Query Error: ${statusCode}`
                    );
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));

            } catch (error: unknown) {
                if (error instanceof TranscriptionError) throw error;
                // Network errors during polling - retry within the loop
                if (i === MAX_POLLING_ATTEMPTS - 1) {
                    const message = error instanceof Error ? error.message : String(error);
                    throw new TranscriptionError(TranscriptionErrorType.NETWORK_ERROR, `Polling network error: ${message}`);
                }
                await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
            }
        }

        throw new TranscriptionError(TranscriptionErrorType.UNKNOWN_ERROR, 'Transcription timed out during polling');
    }

    getConstraints(): TranscriptionConstraints {
        return {
            maxDurationSeconds: 14400, // 4 hours for standard edition (docs say > 2h)
            maxFileSizeBytes: 512 * 1024 * 1024 // 512MB as requested
        };
    }

    supportsStreaming(): boolean {
        return false;
    }

    private async blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    private generateUUID(): string {
        try {
            return crypto.randomUUID();
        } catch {
            // Fallback for older environments
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }

    private getAudioFormat(audio: Blob): string {
        const type = audio.type.toLowerCase();
        if (type.includes('wav')) return 'wav';
        if (type.includes('mp3') || type.includes('mpeg')) return 'mp3';
        if (type.includes('ogg')) return 'ogg';
        // Default to wav as we often convert to it
        return 'wav';
    }
}
