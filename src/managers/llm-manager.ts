import { PluginSettings } from '../types/config';
import { LLMService, LLMMessage } from '../types/llm';
import { LLMServiceFactory } from '../services/llm/factory';

export class LLMManager {
    private service: LLMService;

    constructor(private settings: PluginSettings) {
        this.service = LLMServiceFactory.create(settings);
    }

    public updateSettings(settings: PluginSettings) {
        this.settings = settings;
        this.service = LLMServiceFactory.create(settings);
    }

    /**
     * Send messages to the configured LLM and get a response.
     */
    async complete(messages: LLMMessage[]): Promise<string> {
        return await this.service.complete(messages);
    }

    /**
     * Convenience method to polish text using the configured System Prompt.
     */
    async polish(text: string): Promise<string> {
        if (!this.settings.enableAiPolishing) {
            return '';
        }
        
        const messages: LLMMessage[] = [
            { role: 'system', content: this.settings.systemPrompt },
            { role: 'user', content: text }
        ];

        try {
            return await this.complete(messages);
        } catch (error) {
            console.error('LLM Manager: Polishing failed', error);
            // Re-throw to let the UI handle the error (show Notice)
            throw error;
        }
    }
}
