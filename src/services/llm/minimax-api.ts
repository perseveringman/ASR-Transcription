import { requestUrl, RequestUrlParam } from 'obsidian';
import { LLMService, LLMMessage, StreamCallback } from '../../types/llm';
import { PluginSettings } from '../../types/config';

export class MinimaxLLMService implements LLMService {
    readonly name = 'Minimax';

    constructor(private settings: PluginSettings) {}

    private getUrl(): string {
        return `https://api.minimax.chat/v1/text/chatcompletion_v2?GroupId=${this.settings.minimaxGroupId}`;
    }

    private getHeaders(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.settings.minimaxApiKey}`,
            'Content-Type': 'application/json'
        };
    }

    private buildBody(messages: LLMMessage[], stream = false): Record<string, unknown> {
        const body: Record<string, unknown> = {
            model: this.settings.minimaxModel || 'MiniMax-M2.1',
            messages: messages,
            temperature: 0.7
        };

        if (stream) {
            body.stream = true;
        }

        return body;
    }

    async complete(messages: LLMMessage[]): Promise<string> {
        if (!this.settings.minimaxApiKey) {
            throw new Error('Minimax API key is not configured');
        }
        if (!this.settings.minimaxGroupId) {
            throw new Error('Minimax Group ID is not configured');
        }

        const request: RequestUrlParam = {
            url: this.getUrl(),
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(this.buildBody(messages))
        };

        try {
            const response = await requestUrl(request);
            
            if (response.status >= 400) {
                let errorMessage = `Status ${response.status}`;
                try {
                    const errorBody = JSON.parse(response.text);
                    if (errorBody.base_resp && errorBody.base_resp.status_msg) {
                        errorMessage = errorBody.base_resp.status_msg;
                    } else if (errorBody.error) {
                        errorMessage = typeof errorBody.error === 'string' ? errorBody.error : JSON.stringify(errorBody.error);
                    } else {
                        errorMessage = response.text.substring(0, 200);
                    }
                } catch {
                    errorMessage = response.text.substring(0, 200);
                }
                throw new Error(`Minimax error: ${errorMessage}`);
            }

            const data = response.json;
            if (!data.choices || data.choices.length === 0) {
                if (data.base_resp && data.base_resp.status_code !== 0) {
                    throw new Error(`Minimax error: ${data.base_resp.status_msg}`);
                }
                throw new Error('No completion choices returned from Minimax');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('Minimax API request failed:', error);
            throw error;
        }
    }

    supportsStreaming(): boolean {
        return true;
    }

    async stream(messages: LLMMessage[], onChunk: StreamCallback): Promise<string> {
        if (!this.settings.minimaxApiKey) {
            throw new Error('Minimax API key is not configured');
        }
        if (!this.settings.minimaxGroupId) {
            throw new Error('Minimax Group ID is not configured');
        }

        try {
            const response = await fetch(this.getUrl(), {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(this.buildBody(messages, true))
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Status ${response.status}`;
                try {
                    const errorBody = JSON.parse(errorText);
                    if (errorBody.base_resp?.status_msg) {
                        errorMessage = errorBody.base_resp.status_msg;
                    } else if (errorBody.error) {
                        errorMessage = typeof errorBody.error === 'string' ? errorBody.error : JSON.stringify(errorBody.error);
                    }
                } catch {
                    errorMessage = errorText.substring(0, 200);
                }
                throw new Error(`Minimax error: ${errorMessage}`);
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
                    if (!data || data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        // Minimax uses OpenAI-like format
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            fullContent += content;
                            onChunk(content, false);
                        }
                    } catch {
                        // Skip malformed JSON
                    }
                }
            }

            return fullContent;
        } catch (error) {
            console.error('Minimax streaming request failed:', error);
            throw error;
        }
    }
}
