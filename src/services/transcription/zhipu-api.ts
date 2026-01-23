import { requestUrl } from 'obsidian';
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

        // Prepare multipart form data
        let filename = audio instanceof File ? audio.name : 'audio.mp3';
        if (audio.type === 'audio/wav' && !filename.endsWith('.wav')) {
            filename = 'audio.wav';
        }

        return this.transcribeWithRetry(audio, filename);
    }

    getConstraints(): TranscriptionConstraints {
        return {
            maxDurationSeconds: 30,
            maxFileSizeBytes: 25 * 1024 * 1024 // 25MB
        };
    }

    private async transcribeWithRetry(audio: File | Blob, filename: string, attempt = 0): Promise<TranscriptionResult> {
        try {
            // Build multipart/form-data body manually with binary data
            const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
            const fileData = await this.blobToArrayBuffer(audio);
            
            // Build multipart body as ArrayBuffer
            const textEncoder = new TextEncoder();
            const parts: Uint8Array[] = [];

            // Helper to add text parts
            const addTextPart = (name: string, value: string) => {
                const partText = [
                    `--${boundary}\r\n`,
                    `Content-Disposition: form-data; name="${name}"\r\n`,
                    `\r\n`,
                    `${value}\r\n`
                ].join('');
                parts.push(textEncoder.encode(partText));
            };

            // Add file part header
            const fileHeader = [
                `--${boundary}\r\n`,
                `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`,
                `Content-Type: ${audio.type || 'audio/mpeg'}\r\n`,
                `\r\n`
            ].join('');
            parts.push(textEncoder.encode(fileHeader));
            
            // Add file binary data
            parts.push(new Uint8Array(fileData));
            parts.push(textEncoder.encode('\r\n'));

            // Add model part
            addTextPart('model', 'glm-asr-2512');

            // Add prompt if provided
            if (this.settings.contextPrompt) {
                addTextPart('prompt', this.settings.contextPrompt);
            }

            // Add hotwords if provided
            if (this.settings.hotwords && this.settings.hotwords.length > 0) {
                addTextPart('hotwords', JSON.stringify(this.settings.hotwords));
            }

            // Add closing boundary
            parts.push(textEncoder.encode(`--${boundary}--`));

            // Combine all parts into a single ArrayBuffer
            const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
            const bodyArray = new Uint8Array(totalLength);
            let offset = 0;
            for (const part of parts) {
                bodyArray.set(part, offset);
                offset += part.length;
            }

            // Note: Obsidian's requestUrl expects string body, but multipart/form-data requires binary
            // We'll use ArrayBuffer and let requestUrl handle it, or convert to base64 if needed
            // For now, try using the ArrayBuffer directly
            const bodyString = Array.from(bodyArray, byte => String.fromCharCode(byte)).join('');

            const response = await requestUrl({
                url: this.baseURL,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.zhipuApiKey}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`
                },
                body: bodyString
            });

            if (response.status !== 200) {
                const errorData: ZhipuErrorResponse = (typeof response.json === 'object' ? response.json : (response.text ? JSON.parse(response.text) : {})) as ZhipuErrorResponse;
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
                        return this.transcribeWithRetry(audio, filename, attempt + 1);
                    }
                }
                
                throw new TranscriptionError(
                    TranscriptionErrorType.API_ERROR,
                    errorData.error?.message || `API Error: ${status}`
                );
            }

            const data: ZhipuTranscriptionResponse = (typeof response.json === 'object' ? response.json : JSON.parse(response.text)) as ZhipuTranscriptionResponse;
            
            return {
                text: data.text,
                requestId: data.request_id,
                model: data.model
            };

        } catch (error: unknown) {
            if (error instanceof TranscriptionError) {
                throw error;
            }
            
            if (error instanceof Error && error.name === 'AbortError') {
                throw new TranscriptionError(TranscriptionErrorType.UNKNOWN_ERROR, 'Request timed out');
            }

            const message = error instanceof Error ? error.message : String(error);
            throw new TranscriptionError(
                TranscriptionErrorType.NETWORK_ERROR,
                `Network error: ${message}`
            );
        }
    }

    private async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
        return await blob.arrayBuffer();
    }

    supportsStreaming(): boolean {
        return false;
    }
}
