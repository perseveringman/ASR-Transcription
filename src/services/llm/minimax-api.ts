import { requestUrl, RequestUrlParam } from 'obsidian';
import { LLMService, LLMMessage, StreamCallback } from '../../types/llm';
import { PluginSettings } from '../../types/config';

/**
 * MiniMax LLM Service
 * Uses OpenAI-compatible API at https://api.minimaxi.com/v1
 * Supports MiniMax-M2.1, MiniMax-M2.1-lightning, MiniMax-M2
 */
export class MinimaxLLMService implements LLMService {
    readonly name = 'Minimax';
    private readonly baseUrl = 'https://api.minimaxi.com/v1/chat/completions';

    constructor(private settings: PluginSettings) {}

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
            temperature: 1.0 // MiniMax recommends temperature=1.0
        };

        if (stream) {
            body.stream = true;
        }

        return body;
    }

    private extractContent(content: string): string {
        // M2.1 may include <think> tags in content, strip them for final output
        return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    }

    async complete(messages: LLMMessage[]): Promise<string> {
        if (!this.settings.minimaxApiKey) {
            throw new Error('Minimax API key is not configured');
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
                    if (errorBody.error?.message) {
                        errorMessage = errorBody.error.message;
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
                throw new Error('No completion choices returned from Minimax');
            }

            const content = data.choices[0].message.content || '';
            return this.extractContent(content);
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

        console.log('[Minimax] Starting streaming request...');

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(this.buildBody(messages, true))
            });

            console.log('[Minimax] Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Minimax] Error response:', errorText);
                let errorMessage = `Status ${response.status}`;
                try {
                    const errorBody = JSON.parse(errorText);
                    if (errorBody.error?.message) {
                        errorMessage = errorBody.error.message;
                    }
                } catch {
                    errorMessage = errorText.substring(0, 200);
                }
                throw new Error(`Minimax error: ${errorMessage}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                console.error('[Minimax] Response body is not readable');
                throw new Error('Response body is not readable');
            }

            console.log('[Minimax] Got reader, starting to read chunks...');

            const decoder = new TextDecoder();
            let fullContent = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    console.log('[Minimax] Stream done, total length:', fullContent.length);
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
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            fullContent += content;
                            // Stream content directly, let caller handle display
                            // The <think> tags will be visible during streaming
                            // but final content is filtered in extractContent
                            onChunk(content, false);
                        }
                    } catch (e) {
                        console.warn('[Minimax] Failed to parse chunk:', data, e);
                    }
                }
            }

            // Return content with <think> blocks stripped
            return this.extractContent(fullContent);
        } catch (error) {
            console.error('Minimax streaming request failed:', error);
            throw error;
        }
    }
}
