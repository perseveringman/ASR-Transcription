import { requestUrl, RequestUrlParam } from 'obsidian';
import { LLMService, LLMMessage } from '../../types/llm';
import { PluginSettings } from '../../types/config';

export class AnthropicLLMService implements LLMService {
    readonly name = 'Anthropic Claude';

    constructor(private settings: PluginSettings) {}

    async complete(messages: LLMMessage[]): Promise<string> {
        if (!this.settings.anthropicApiKey) {
            throw new Error('Anthropic API key is not configured');
        }

        const url = 'https://api.anthropic.com/v1/messages';
        
        // Convert messages to Anthropic format
        // System message is a top-level parameter
        const systemMessage = messages.find(m => m.role === 'system');
        const contentMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role,
                content: m.content
            }));

        const body: any = {
            model: this.settings.anthropicModel || 'claude-3-5-sonnet-latest',
            max_tokens: 4096,
            messages: contentMessages
        };

        if (systemMessage) {
            body.system = systemMessage.content;
        }

        const request: RequestUrlParam = {
            url: url,
            method: 'POST',
            headers: {
                'x-api-key': this.settings.anthropicApiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
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
                throw new Error(`Anthropic error: ${errorMessage}`);
            }

            const data = response.json;
            if (!data.content || data.content.length === 0) {
                throw new Error('No content returned from Anthropic');
            }

            // Anthropic returns an array of content blocks, usually text
            return data.content[0].text;
        } catch (error) {
            console.error('Anthropic API request failed:', error);
            throw error;
        }
    }
}
