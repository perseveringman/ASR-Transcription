import { requestUrl } from 'obsidian';
import { 
    TranscriptionService, 
    TranscriptionResult, 
    TranscriptionError, 
    TranscriptionErrorType, 
    TranscriptionConstraints,
    TranscriptionOptions
} from '../../types/transcription';
import { PluginSettings } from '../../types/config';

interface WhisperResponse {
    text: string;
    language?: string;
    duration?: number;
    segments?: Array<{
        start: number;
        end: number;
        text: string;
    }>;
}

/**
 * Local Whisper transcription service.
 * Supports common Whisper server implementations:
 * - faster-whisper-server (https://github.com/fedirz/faster-whisper-server)
 * - whisper-asr-webservice (https://github.com/ahmetoner/whisper-asr-webservice)
 * - OpenAI Whisper API compatible servers
 * 
 * Default endpoint: POST /v1/audio/transcriptions (OpenAI compatible)
 */
export class LocalWhisperTranscriptionService implements TranscriptionService {
    name = 'local-whisper';

    constructor(private settings: PluginSettings) {}

    async transcribe(audio: File | Blob, options?: TranscriptionOptions): Promise<TranscriptionResult> {
        const serverUrl = this.settings.whisperServerUrl?.trim();
        
        if (!serverUrl) {
            throw new TranscriptionError(
                TranscriptionErrorType.AUTH_ERROR,
                'Whisper server URL is not configured. Please set it in the settings.'
            );
        }

        const endpoint = this.buildEndpoint(serverUrl);
        
        return this.transcribeWithRetry(audio, endpoint, options, 0);
    }

    private buildEndpoint(serverUrl: string): string {
        // Remove trailing slash
        const baseUrl = serverUrl.replace(/\/+$/, '');
        
        // OpenAI compatible endpoint
        return `${baseUrl}/v1/audio/transcriptions`;
    }

    private async transcribeWithRetry(
        audio: File | Blob, 
        endpoint: string, 
        options?: TranscriptionOptions,
        attempt = 0
    ): Promise<TranscriptionResult> {
        try {
            const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
            const filename = audio instanceof File ? audio.name : 'audio.wav';
            
            const textEncoder = new TextEncoder();
            const parts: Uint8Array[] = [];

            const addTextPart = (name: string, value: string) => {
                const partText = [
                    `--${boundary}\r\n`,
                    `Content-Disposition: form-data; name="${name}"\r\n`,
                    `\r\n`,
                    `${value}\r\n`
                ].join('');
                parts.push(textEncoder.encode(partText));
            };

            // Add file part
            const fileHeader = [
                `--${boundary}\r\n`,
                `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`,
                `Content-Type: ${audio.type || 'audio/wav'}\r\n`,
                `\r\n`
            ].join('');
            parts.push(textEncoder.encode(fileHeader));
            
            const fileData = await audio.arrayBuffer();
            parts.push(new Uint8Array(fileData));
            parts.push(textEncoder.encode('\r\n'));

            // Add model parameter
            if (this.settings.whisperModel) {
                addTextPart('model', this.settings.whisperModel);
            }

            // Add language parameter
            if (this.settings.whisperLanguage && this.settings.whisperLanguage !== 'auto') {
                addTextPart('language', this.settings.whisperLanguage);
            }

            // Add prompt if provided
            if (options?.prompt || this.settings.contextPrompt) {
                addTextPart('prompt', options?.prompt || this.settings.contextPrompt);
            }

            // Response format
            addTextPart('response_format', 'json');

            // Add closing boundary
            parts.push(textEncoder.encode(`--${boundary}--`));

            // Combine all parts
            const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
            const bodyArray = new Uint8Array(totalLength);
            let offset = 0;
            for (const part of parts) {
                bodyArray.set(part, offset);
                offset += part.length;
            }

            const bodyString = Array.from(bodyArray, byte => String.fromCharCode(byte)).join('');

            const response = await requestUrl({
                url: endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`
                },
                body: bodyString,
                throw: false
            });

            if (response.status !== 200) {
                const status = response.status;
                
                if (status === 0 || status >= 500 || status === 503) {
                    // Server not running or overloaded
                    if (attempt < this.settings.retryCount) {
                        const delay = Math.pow(2, attempt) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return this.transcribeWithRetry(audio, endpoint, options, attempt + 1);
                    }
                    
                    throw new TranscriptionError(
                        TranscriptionErrorType.NETWORK_ERROR,
                        `Whisper server is not reachable at ${this.settings.whisperServerUrl}. Make sure the server is running.`
                    );
                }
                
                if (status === 413) {
                    throw new TranscriptionError(
                        TranscriptionErrorType.FILE_TOO_LARGE,
                        'Audio file too large for the Whisper server'
                    );
                }

                let errorMessage = `Whisper server error: ${status}`;
                try {
                    const errorData = response.json;
                    if (errorData?.error?.message) {
                        errorMessage = errorData.error.message;
                    } else if (errorData?.detail) {
                        errorMessage = errorData.detail;
                    }
                } catch {
                    // Ignore JSON parse error
                }
                
                throw new TranscriptionError(
                    TranscriptionErrorType.API_ERROR,
                    errorMessage
                );
            }

            const data: WhisperResponse = response.json;
            
            if (!data.text && data.text !== '') {
                throw new TranscriptionError(
                    TranscriptionErrorType.API_ERROR,
                    'Invalid response from Whisper server: missing text field'
                );
            }

            return {
                text: data.text,
                requestId: `local-${Date.now()}`,
                model: this.settings.whisperModel || 'whisper',
                duration: data.duration
            };

        } catch (error: unknown) {
            if (error instanceof TranscriptionError) {
                throw error;
            }

            const message = error instanceof Error ? error.message : String(error);
            
            // Check for connection errors
            if (message.includes('ECONNREFUSED') || message.includes('fetch failed') || message.includes('net::ERR')) {
                throw new TranscriptionError(
                    TranscriptionErrorType.NETWORK_ERROR,
                    `Cannot connect to Whisper server at ${this.settings.whisperServerUrl}. Make sure the server is running.`
                );
            }
            
            throw new TranscriptionError(
                TranscriptionErrorType.NETWORK_ERROR,
                `Whisper transcription failed: ${message}`
            );
        }
    }

    getConstraints(): TranscriptionConstraints {
        // Local Whisper typically has no hard limits, but we set reasonable defaults
        // for chunking (can handle longer audio, but chunking improves reliability)
        return {
            maxDurationSeconds: 600, // 10 minutes per chunk
            maxFileSizeBytes: 500 * 1024 * 1024 // 500MB
        };
    }

    supportsStreaming(): boolean {
        return false;
    }
}
