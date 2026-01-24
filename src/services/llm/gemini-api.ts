import { requestUrl, RequestUrlParam } from 'obsidian';
import { LLMService, LLMMessage } from '../../types/llm';
import { PluginSettings } from '../../types/config';

export class GeminiLLMService implements LLMService {
    readonly name = 'Google Gemini';

    constructor(private settings: PluginSettings) {}

    async complete(messages: LLMMessage[]): Promise<string> {
        if (!this.settings.geminiApiKey) {
            throw new Error('Gemini API key is not configured');
        }

        const model = this.settings.geminiModel || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.settings.geminiApiKey}`;

        // Convert messages to Gemini format
        // Gemini expects { role: "user" | "model", parts: [{ text: "..." }] }
        // System prompt is best handled by "system_instruction" but v1beta support varies by model.
        // For simplicity, we'll prepend system prompt to the first user message or use "user" role for system if needed, 
        // but 'system' role is supported in newer models.
        
        const contents = messages
            .filter(m => m.role !== 'system') // Filter out system for now, we'll handle it separately or prepend
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));
            
        const systemMessage = messages.find(m => m.role === 'system');
        const body: any = {
            contents: contents,
            generationConfig: {
                temperature: 0.7
            }
        };

        if (systemMessage) {
            // Use system_instruction if available (Gemini 1.5+)
             body.system_instruction = {
                parts: [{ text: systemMessage.content }]
            };
        }

        const request: RequestUrlParam = {
            url: url,
            method: 'POST',
            headers: {
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
}
