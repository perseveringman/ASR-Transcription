import { requestUrl, RequestUrlParam } from 'obsidian';
import { LLMService, LLMMessage, StreamCallback } from '../../types/llm';
import { PluginSettings } from '../../types/config';

export class GeminiLLMService implements LLMService {
    readonly name = 'Google Gemini';
    private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    constructor(private settings: PluginSettings) {}

    private getModel(): string {
        return this.settings.geminiModel || 'gemini-2.0-flash';
    }

    private buildBody(messages: LLMMessage[]): Record<string, unknown> {
        const contents = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));
            
        const systemMessage = messages.find(m => m.role === 'system');
        const body: Record<string, unknown> = {
            contents: contents,
            generationConfig: {
                temperature: 0.7
            }
        };

        if (systemMessage) {
            body.system_instruction = {
                parts: [{ text: systemMessage.content }]
            };
        }

        return body;
    }

    async complete(messages: LLMMessage[]): Promise<string> {
        if (!this.settings.geminiApiKey) {
            throw new Error('Gemini API key is not configured');
        }

        const url = `${this.baseUrl}/${this.getModel()}:generateContent?key=${this.settings.geminiApiKey}`;

        const request: RequestUrlParam = {
            url: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
                throw new Error(`Gemini error: ${errorMessage}`);
            }

            const data = response.json;
            if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
                throw new Error('No content returned from Gemini');
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API request failed:', error);
            throw error;
        }
    }

    supportsStreaming(): boolean {
        return true;
    }

    async stream(messages: LLMMessage[], onChunk: StreamCallback): Promise<string> {
        if (!this.settings.geminiApiKey) {
            throw new Error('Gemini API key is not configured');
        }

        const url = `${this.baseUrl}/${this.getModel()}:streamGenerateContent?alt=sse&key=${this.settings.geminiApiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.buildBody(messages))
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
                throw new Error(`Gemini error: ${errorMessage}`);
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
                    if (!data) continue;

                    try {
                        const parsed = JSON.parse(data);
                        // Gemini streaming format
                        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            fullContent += text;
                            onChunk(text, false);
                        }
                    } catch {
                        // Skip malformed JSON
                    }
                }
            }

            return fullContent;
        } catch (error) {
            console.error('Gemini streaming request failed:', error);
            throw error;
        }
    }
}
