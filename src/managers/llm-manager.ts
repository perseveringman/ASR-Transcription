import { PluginSettings } from '../types/config';
import { LLMService, LLMMessage, StreamCallback } from '../types/llm';
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
     * Check if current service supports streaming
     */
    public supportsStreaming(): boolean {
        return this.service.supportsStreaming?.() ?? false;
    }

    /**
     * Send messages to the configured LLM and get a response.
     */
    async complete(messages: LLMMessage[]): Promise<string> {
        return await this.service.complete(messages);
    }

    /**
     * Stream messages to the configured LLM with real-time chunks.
     */
    async stream(messages: LLMMessage[], onChunk: StreamCallback): Promise<string> {
        if (!this.service.stream) {
            // Fallback to non-streaming if not supported
            const result = await this.service.complete(messages);
            onChunk(result, true);
            return result;
        }
        return await this.service.stream(messages, onChunk);
    }

    /**
     * Convenience method to polish text using the configured System Prompt.
     */
    async polish(text: string, styleId?: string): Promise<string> {
        if (!this.settings.enableAiPolishing) {
            return '';
        }
        
        // Find the selected preset
        let systemPrompt = this.settings.systemPrompt;
        
        // Priority: runtime styleId > settings default
        const targetStyleId = styleId || this.settings.selectedStylePresetId;
        
        if (targetStyleId) {
            const preset = this.settings.stylePresets.find(p => p.id === targetStyleId);
            if (preset) {
                systemPrompt = preset.prompt;
            }
        }

        const messages: LLMMessage[] = [
            { role: 'system', content: systemPrompt },
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
