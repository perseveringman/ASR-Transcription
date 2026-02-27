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

    /**
     * Beautify note formatting/style without changing the text content.
     * Uses AI to improve markdown structure, headings, lists, etc.
     */
    async beautifyNote(content: string): Promise<string> {
        const systemPrompt = `你是一个专业的 Markdown 笔记美化助手。你的任务是优化笔记的排版和格式，使其更加清晰易读。

要求：
1. **保持原文内容不变**：不要修改、删除或添加任何实质性文字内容
2. **优化格式**：
   - 适当添加或调整标题层级（#, ##, ###）
   - 将适合的内容转换为列表（有序或无序）
   - 添加适当的空行分隔不同段落或主题
   - 使用引用块（>）突出重要内容
   - 使用加粗（**）或斜体（*）强调关键词
   - 如果有代码，使用代码块格式化
3. **保持语言**：保持原文的语言，不要翻译
4. **直接输出**：只输出美化后的笔记内容，不要添加任何解释或说明

请美化以下笔记：`;

        const messages: LLMMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: content }
        ];

        try {
            return await this.complete(messages);
        } catch (error) {
            console.error('LLM Manager: Beautify note failed', error);
            throw error;
        }
    }
}
