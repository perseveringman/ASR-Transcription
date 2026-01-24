import { requestUrl, RequestUrlParam } from 'obsidian';
import { LLMService, LLMMessage } from '../../types/llm';

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

    async complete(messages: LLMMessage[]): Promise<string> {
        if (!this.config.apiKey) {
            throw new Error(`${this.nameStr} API key is not configured`);
        }

        // Ensure baseUrl doesn't end with slash if we append /chat/completions
        // Some baseUrls might already include /v1
        let url = this.config.baseUrl;
        if (!url.endsWith('/chat/completions')) {
             if (url.endsWith('/')) {
                 url = url.slice(0, -1);
             }
             // If it doesn't have /v1 and it's not a full path, usually we might append it, 
             // but to be safe, let's assume the user/config provides the base up to version or root.
             // Standard OpenAI is https://api.openai.com/v1
             // We will append /chat/completions
             url = `${url}/chat/completions`;
        }

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
}
