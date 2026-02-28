import { LLMProvider } from '../../types/config';
import ASRPlugin from '../../main';
import { Setting } from 'obsidian';

export class LLMSettingsTab {
    constructor(private containerEl: HTMLElement, private plugin: ASRPlugin, private refresh: () => void) {}

    display(): void {
        new Setting(this.containerEl)
            .setName('智能体（LLM）')
            .setHeading();
            
        new Setting(this.containerEl)
            .setDesc('配置用于 AI 润色等功能的 LLM 提供商。')
            .setName('全局 LLM 提供商')
            .addDropdown(dropdown => dropdown
                .addOption(LLMProvider.OPENROUTER, 'OpenRouter')
                .addOption(LLMProvider.GEMINI, 'Google Gemini')
                .addOption(LLMProvider.OPENAI, 'OpenAI')
                .addOption(LLMProvider.ANTHROPIC, 'Anthropic Claude')
                .addOption(LLMProvider.ZHIPU, '智谱 AI')
                .addOption(LLMProvider.MINIMAX, 'Minimax')
                .addOption(LLMProvider.DEEPSEEK, 'DeepSeek')
                .setValue(this.plugin.settings.llmProvider)
                .onChange(async (value) => {
                    this.plugin.settings.llmProvider = value as LLMProvider;
                    await this.plugin.saveSettings();
                    this.refresh();
                }));

        this.displayProviderSettings();
    }

    private displayProviderSettings() {
        const provider = this.plugin.settings.llmProvider;
        const { containerEl } = this;

        if (provider === LLMProvider.OPENROUTER) {
            new Setting(containerEl)
                .setName('OpenRouter API 密钥')
                .setDesc('您的 OpenRouter API 密钥')
                .addText(text => text
                    .setPlaceholder('sk-or-...')
                    .setValue(this.plugin.settings.openRouterApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.openRouterApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('模型')
                .setDesc('OpenRouter 模型 ID')
                .addText(text => text
                    .setPlaceholder('google/gemini-2.0-flash-exp:free')
                    .setValue(this.plugin.settings.openRouterModel)
                    .onChange(async (value) => {
                        this.plugin.settings.openRouterModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
        } else if (provider === LLMProvider.GEMINI) {
            new Setting(containerEl)
                .setName('Gemini API 密钥')
                .setDesc('您的 Google Gemini API 密钥')
                .addText(text => text
                    .setPlaceholder('输入您的 API 密钥')
                    .setValue(this.plugin.settings.geminiApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.geminiApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('模型')
                .setDesc('Gemini 模型 ID')
                .addText(text => text
                    .setPlaceholder('gemini-2.0-flash')
                    .setValue(this.plugin.settings.geminiModel)
                    .onChange(async (value) => {
                        this.plugin.settings.geminiModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
        } else if (provider === LLMProvider.OPENAI) {
            new Setting(containerEl)
                .setName('OpenAI API 密钥')
                .setDesc('您的 OpenAI API 密钥')
                .addText(text => text
                    .setPlaceholder('sk-...')
                    .setValue(this.plugin.settings.openAIApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.openAIApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('模型')
                .setDesc('OpenAI 模型 ID')
                .addText(text => text
                    .setPlaceholder('gpt-4o-mini')
                    .setValue(this.plugin.settings.openAIModel)
                    .onChange(async (value) => {
                        this.plugin.settings.openAIModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
            
            new Setting(containerEl)
                .setName('基础地址')
                .setDesc('自定义 API 基础地址（可选）')
                .addText(text => text
                    .setPlaceholder('https://api.openai.com/v1')
                    .setValue(this.plugin.settings.openAIBaseUrl)
                    .onChange(async (value) => {
                        this.plugin.settings.openAIBaseUrl = value.trim();
                        await this.plugin.saveSettings();
                    }));
        } else if (provider === LLMProvider.ANTHROPIC) {
            new Setting(containerEl)
                .setName('Anthropic API 密钥')
                .setDesc('您的 Anthropic API 密钥')
                .addText(text => text
                    .setPlaceholder('sk-ant-...')
                    .setValue(this.plugin.settings.anthropicApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.anthropicApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('模型')
                .setDesc('Claude 模型 ID')
                .addText(text => text
                    .setPlaceholder('claude-3-5-sonnet-latest')
                    .setValue(this.plugin.settings.anthropicModel)
                    .onChange(async (value) => {
                        this.plugin.settings.anthropicModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
        } else if (provider === LLMProvider.ZHIPU) {
            new Setting(containerEl)
                .setName('智谱 LLM API 密钥')
                .setDesc('您的智谱 AI API 密钥（可与 ASR 共用）')
                .addText(text => text
                    .setPlaceholder('输入您的 API 密钥')
                    .setValue(this.plugin.settings.zhipuLLMApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.zhipuLLMApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('模型')
                .setDesc('智谱模型 ID')
                .addText(text => text
                    .setPlaceholder('glm-4-flash')
                    .setValue(this.plugin.settings.zhipuLLMModel)
                    .onChange(async (value) => {
                        this.plugin.settings.zhipuLLMModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
        } else if (provider === LLMProvider.MINIMAX) {
            new Setting(containerEl)
                .setName('Minimax API 密钥')
                .setDesc('您的 Minimax API 密钥')
                .addText(text => text
                    .setPlaceholder('输入您的 API 密钥')
                    .setValue(this.plugin.settings.minimaxApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.minimaxApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('模型')
                .setDesc('Minimax 模型 ID')
                .addText(text => text
                    .setPlaceholder('MiniMax-M2.5')
                    .setValue(this.plugin.settings.minimaxModel)
                    .onChange(async (value) => {
                        this.plugin.settings.minimaxModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
        } else if (provider === LLMProvider.DEEPSEEK) {
            new Setting(containerEl)
                .setName('DeepSeek API 密钥')
                .setDesc('您的 DeepSeek API 密钥')
                .addText(text => text
                    .setPlaceholder('sk-...')
                    .setValue(this.plugin.settings.deepseekApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.deepseekApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('模型')
                .setDesc('DeepSeek 模型 ID')
                .addText(text => text
                    .setPlaceholder('deepseek-chat')
                    .setValue(this.plugin.settings.deepseekModel)
                    .onChange(async (value) => {
                        this.plugin.settings.deepseekModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
        }
    }
}
