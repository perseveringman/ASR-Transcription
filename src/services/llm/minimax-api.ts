import { requestUrl, RequestUrlParam } from 'obsidian';
import { LLMService, LLMMessage } from '../../types/llm';
import { PluginSettings } from '../../types/config';

export class MinimaxLLMService implements LLMService {
    readonly name = 'Minimax';

    constructor(private settings: PluginSettings) {}

    async complete(messages: LLMMessage[]): Promise<string> {
        if (!this.settings.minimaxApiKey) {
            throw new Error('Minimax API key is not configured');
        }
        if (!this.settings.minimaxGroupId) {
             throw new Error('Minimax Group ID is not configured');
        }

        const url = `https://api.minimax.chat/v1/text/chatcompletion_v2?GroupId=${this.settings.minimaxGroupId}`;
        
        const body = {
            model: this.settings.minimaxModel || 'abab6.5s-chat',
            messages: messages,
            temperature: 0.7
        };

        const request: RequestUrlParam = {
            url: url,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.settings.minimaxApiKey}`,
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
            // Minimax response structure matches OpenAI mostly
            if (!data.choices || data.choices.length === 0) {
                 // Check for base_resp error just in case
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
}
