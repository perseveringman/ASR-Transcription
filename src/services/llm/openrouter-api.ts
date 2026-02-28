import { requestUrl, RequestUrlParam, Platform } from 'obsidian';
import { LLMService, LLMMessage, StreamCallback } from '../../types/llm';
import { PluginSettings } from '../../types/config';

export class OpenRouterLLMService implements LLMService {
    readonly name = 'OpenRouter';
    private readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    constructor(private settings: PluginSettings) {}

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.settings.openRouterApiKey}`,
            'Content-Type': 'application/json',
        };
        // HTTP-Referer and X-Title are optional for OpenRouter.
        // On iOS, system networking may strip or reject custom Referer headers,
        // causing 403 errors. Only include them on desktop.
        if (!Platform.isMobile) {
            headers['HTTP-Referer'] = 'https://github.com/obsidian-plugins/asr-transcription';
            headers['X-Title'] = 'Obsidian ASR Plugin';
        }
        return headers;
    }

    async complete(messages: LLMMessage[]): Promise<string> {
        if (!this.settings.openRouterApiKey) {
            throw new Error('OpenRouter API key is not configured');
        }

        const body = {
            model: this.settings.openRouterModel,
            messages: messages,
            temperature: 0.7
        };

        const request: RequestUrlParam = {
            url: this.baseUrl,
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(body),
            throw: false
        };

        try {
            const response = await requestUrl(request);
            
            if (response.status >= 400) {
                let errorMessage = `Status ${response.status}`;
                try {
                    const errorBody = typeof response.json === 'object' ? response.json : JSON.parse(response.text);
                    if (errorBody.error && errorBody.error.message) {
                        errorMessage = errorBody.error.message;
                    } else {
                        errorMessage = response.text?.substring(0, 300) || `HTTP ${response.status}`;
                    }
                } catch {
                    errorMessage = response.text?.substring(0, 300) || `HTTP ${response.status}`;
                }
                throw new Error(`OpenRouter error (${response.status}): ${errorMessage}`);
            }

            const data = response.json;
            if (!data.choices || data.choices.length === 0) {
                throw new Error('No completion choices returned from OpenRouter');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenRouter API request failed:', error);
            throw error;
        }
    }

    supportsStreaming(): boolean {
        return true;
    }

    async stream(messages: LLMMessage[], onChunk: StreamCallback): Promise<string> {
        if (!this.settings.openRouterApiKey) {
            throw new Error('OpenRouter API key is not configured');
        }

        const body = {
            model: this.settings.openRouterModel,
            messages: messages,
            temperature: 0.7,
            stream: true
        };

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Status ${response.status}`;
                try {
                    const errorBody = JSON.parse(errorText);
                    if (errorBody.error?.message) {
                        errorMessage = errorBody.error.message;
                    }
                } catch {
                    errorMessage = errorText.substring(0, 200);
                }
                throw new Error(`OpenRouter error: ${errorMessage}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Response body is not readable');
            }

            const decoder = new TextDecoder();
            let fullContent = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    onChunk('', true);
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data:')) continue;
                    
                    const data = trimmed.slice(5).trim();
                    if (data === '[DONE]') {
                        onChunk('', true);
                        continue;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            fullContent += content;
                            onChunk(content, false);
                        }
                    } catch {
                        // Skip malformed JSON chunks
                    }
                }
            }

            return fullContent;
        } catch (error) {
            console.error('OpenRouter streaming request failed:', error);
            throw error;
        }
    }
}
