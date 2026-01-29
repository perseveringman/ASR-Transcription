import { requestUrl, RequestUrlParam } from 'obsidian';
import { LLMService, LLMMessage, StreamCallback } from '../../types/llm';
import { PluginSettings } from '../../types/config';

export class AnthropicLLMService implements LLMService {
    readonly name = 'Anthropic Claude';
    private readonly baseUrl = 'https://api.anthropic.com/v1/messages';

    constructor(private settings: PluginSettings) {}

    private getHeaders(): Record<string, string> {
        return {
            'x-api-key': this.settings.anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        };
    }

    private buildBody(messages: LLMMessage[], stream = false): Record<string, unknown> {
        const systemMessage = messages.find(m => m.role === 'system');
        const contentMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role,
                content: m.content
            }));

        const body: Record<string, unknown> = {
            model: this.settings.anthropicModel || 'claude-3-5-sonnet-latest',
            max_tokens: 4096,
            messages: contentMessages
        };

        if (systemMessage) {
            body.system = systemMessage.content;
        }

        if (stream) {
            body.stream = true;
        }

        return body;
    }

    async complete(messages: LLMMessage[]): Promise<string> {
        if (!this.settings.anthropicApiKey) {
            throw new Error('Anthropic API key is not configured');
        }

        const request: RequestUrlParam = {
            url: this.baseUrl,
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
                    if (errorBody.error && errorBody.error.message) {
                        errorMessage = errorBody.error.message;
                    } else {
                        errorMessage = response.text.substring(0, 200);
                    }
                } catch {
                    errorMessage = response.text.substring(0, 200);
                }
                throw new Error(`Anthropic error: ${errorMessage}`);
            }

            const data = response.json;
            if (!data.content || data.content.length === 0) {
                throw new Error('No content returned from Anthropic');
            }

            return data.content[0].text;
        } catch (error) {
            console.error('Anthropic API request failed:', error);
            throw error;
        }
    }

    supportsStreaming(): boolean {
        return true;
    }

    async stream(messages: LLMMessage[], onChunk: StreamCallback): Promise<string> {
        if (!this.settings.anthropicApiKey) {
            throw new Error('Anthropic API key is not configured');
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(this.buildBody(messages, true))
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
                throw new Error(`Anthropic error: ${errorMessage}`);
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
                        // Anthropic streaming format: event types include content_block_delta
                        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                            fullContent += parsed.delta.text;
                            onChunk(parsed.delta.text, false);
                        }
                    } catch {
                        // Skip malformed JSON
                    }
                }
            }

            return fullContent;
        } catch (error) {
            console.error('Anthropic streaming request failed:', error);
            throw error;
        }
    }
}
