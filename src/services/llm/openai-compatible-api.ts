import { requestUrl, RequestUrlParam } from 'obsidian';
import { LLMService, LLMMessage, StreamCallback } from '../../types/llm';

export interface OpenAIConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
}

export class OpenAICompatibleLLMService implements LLMService {
    constructor(private nameStr: string, private config: OpenAIConfig) {}

    get name(): string {
        return this.nameStr;
    }

    private buildUrl(): string {
        let url = this.config.baseUrl;
        if (!url.endsWith('/chat/completions')) {
            if (url.endsWith('/')) {
                url = url.slice(0, -1);
            }
            url = `${url}/chat/completions`;
        }
        return url;
    }

    async complete(messages: LLMMessage[]): Promise<string> {
        if (!this.config.apiKey) {
            throw new Error(`${this.nameStr} API key is not configured`);
        }

        const url = this.buildUrl();

        const body = {
            model: this.config.model,
            messages: messages,
            temperature: 0.7
        };

        const request: RequestUrlParam = {
            url: url,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        };

        try {
            const response = await requestUrl(request);
            
            if (response.status >= 400) {
                let errorMessage = `Status ${response.status}`;
                try {
                    const errorBody = JSON.parse(response.text);
                    if (errorBody.error && errorBody.error.message) {
                        errorMessage = errorBody.error.message;
                    } else {
                        errorMessage = response.text.substring(0, 200);
                    }
                } catch {
                    errorMessage = response.text.substring(0, 200);
                }
                throw new Error(`${this.nameStr} error: ${errorMessage}`);
            }

            const data = response.json;
            if (!data.choices || data.choices.length === 0) {
                throw new Error(`No completion choices returned from ${this.nameStr}`);
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error(`${this.nameStr} API request failed:`, error);
            throw error;
        }
    }

    supportsStreaming(): boolean {
        return true;
    }

    async stream(messages: LLMMessage[], onChunk: StreamCallback): Promise<string> {
        if (!this.config.apiKey) {
            throw new Error(`${this.nameStr} API key is not configured`);
        }

        const url = this.buildUrl();

        const body = {
            model: this.config.model,
            messages: messages,
            temperature: 0.7,
            stream: true
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
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
                throw new Error(`${this.nameStr} error: ${errorMessage}`);
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
            console.error(`${this.nameStr} streaming request failed:`, error);
            throw error;
        }
    }
}
