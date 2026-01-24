import { requestUrl, RequestUrlParam } from 'obsidian';
import { LLMService, LLMMessage } from '../../types/llm';
import { PluginSettings } from '../../types/config';

export class OpenRouterLLMService implements LLMService {
    readonly name = 'OpenRouter';

    constructor(private settings: PluginSettings) {}

    async complete(messages: LLMMessage[]): Promise<string> {
        if (!this.settings.openRouterApiKey) {
            throw new Error('OpenRouter API key is not configured');
        }

        const url = 'https://openrouter.ai/api/v1/chat/completions';
        
        const body = {
            model: this.settings.openRouterModel,
            messages: messages,
            temperature: 0.7
        };

        const request: RequestUrlParam = {
            url: url,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.settings.openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/obsidian-plugins/asr-transcription', // Required by OpenRouter
                'X-Title': 'Obsidian ASR Plugin' // Optional
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
                        errorMessage = response.text.substring(0, 200); // Truncate if too long
                    }
                } catch {
                    errorMessage = response.text.substring(0, 200);
                }
                throw new Error(`OpenRouter error: ${errorMessage}`);
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
}
