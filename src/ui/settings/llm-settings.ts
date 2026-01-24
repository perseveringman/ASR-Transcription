import { LLMProvider } from '../../types/config';
import ASRPlugin from '../../main';
import { Setting } from 'obsidian';

export class LLMSettingsTab {
    constructor(private containerEl: HTMLElement, private plugin: ASRPlugin, private refresh: () => void) {}

    display(): void {
        new Setting(this.containerEl)
            .setName('Intelligence (LLM)')
            .setHeading();
            
        new Setting(this.containerEl)
            .setDesc('Configure the LLM provider used for AI features like Polishing.')
            .setName('Global LLM provider')
            .addDropdown(dropdown => dropdown
                .addOption(LLMProvider.OPENROUTER, 'OpenRouter')
                .addOption(LLMProvider.GEMINI, 'Google Gemini')
                .addOption(LLMProvider.OPENAI, 'OpenAI')
                .addOption(LLMProvider.ANTHROPIC, 'Anthropic Claude')
                .addOption(LLMProvider.ZHIPU, 'Zhipu AI')
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
                .setName('OpenRouter API key')
                .setDesc('Your OpenRouter API key')
                .addText(text => text
                    .setPlaceholder('sk-or-...')
                    .setValue(this.plugin.settings.openRouterApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.openRouterApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('Model')
                .setDesc('OpenRouter model ID')
                .addText(text => text
                    .setPlaceholder('google/gemini-2.0-flash-exp:free')
                    .setValue(this.plugin.settings.openRouterModel)
                    .onChange(async (value) => {
                        this.plugin.settings.openRouterModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
        } else if (provider === LLMProvider.GEMINI) {
            new Setting(containerEl)
                .setName('Gemini API key')
                .setDesc('Your Google Gemini API key')
                .addText(text => text
                    .setPlaceholder('Enter your API key')
                    .setValue(this.plugin.settings.geminiApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.geminiApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('Model')
                .setDesc('Gemini model ID')
                .addText(text => text
                    .setPlaceholder('gemini-2.0-flash')
                    .setValue(this.plugin.settings.geminiModel)
                    .onChange(async (value) => {
                        this.plugin.settings.geminiModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
        } else if (provider === LLMProvider.OPENAI) {
            new Setting(containerEl)
                .setName('OpenAI API key')
                .setDesc('Your OpenAI API key')
                .addText(text => text
                    .setPlaceholder('sk-...')
                    .setValue(this.plugin.settings.openAIApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.openAIApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('Model')
                .setDesc('OpenAI model ID')
                .addText(text => text
                    .setPlaceholder('gpt-4o-mini')
                    .setValue(this.plugin.settings.openAIModel)
                    .onChange(async (value) => {
                        this.plugin.settings.openAIModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
            
            new Setting(containerEl)
                .setName('Base URL')
                .setDesc('Custom API Base URL (optional)')
                .addText(text => text
                    .setPlaceholder('https://api.openai.com/v1')
                    .setValue(this.plugin.settings.openAIBaseUrl)
                    .onChange(async (value) => {
                        this.plugin.settings.openAIBaseUrl = value.trim();
                        await this.plugin.saveSettings();
                    }));
        } else if (provider === LLMProvider.ANTHROPIC) {
            new Setting(containerEl)
                .setName('Anthropic API key')
                .setDesc('Your Anthropic API key')
                .addText(text => text
                    .setPlaceholder('sk-ant-...')
                    .setValue(this.plugin.settings.anthropicApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.anthropicApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('Model')
                .setDesc('Claude model ID')
                .addText(text => text
                    .setPlaceholder('claude-3-5-sonnet-latest')
                    .setValue(this.plugin.settings.anthropicModel)
                    .onChange(async (value) => {
                        this.plugin.settings.anthropicModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
        } else if (provider === LLMProvider.ZHIPU) {
            new Setting(containerEl)
                .setName('Zhipu LLM API key')
                .setDesc('Your Zhipu AI API key (can be same as ASR key)')
                .addText(text => text
                    .setPlaceholder('Enter your API key')
                    .setValue(this.plugin.settings.zhipuLLMApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.zhipuLLMApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('Model')
                .setDesc('Zhipu model ID')
                .addText(text => text
                    .setPlaceholder('glm-4-flash')
                    .setValue(this.plugin.settings.zhipuLLMModel)
                    .onChange(async (value) => {
                        this.plugin.settings.zhipuLLMModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
        } else if (provider === LLMProvider.MINIMAX) {
            new Setting(containerEl)
                .setName('Minimax API key')
                .setDesc('Your Minimax API key')
                .addText(text => text
                    .setPlaceholder('Enter your API key')
                    .setValue(this.plugin.settings.minimaxApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.minimaxApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('Group ID')
                .setDesc('Minimax Group ID')
                .addText(text => text
                    .setPlaceholder('Enter your Group ID')
                    .setValue(this.plugin.settings.minimaxGroupId)
                    .onChange(async (value) => {
                        this.plugin.settings.minimaxGroupId = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Model')
                .setDesc('Minimax model ID')
                .addText(text => text
                    .setPlaceholder('abab6.5s-chat')
                    .setValue(this.plugin.settings.minimaxModel)
                    .onChange(async (value) => {
                        this.plugin.settings.minimaxModel = value.trim();
                        await this.plugin.saveSettings();
                    }));
        } else if (provider === LLMProvider.DEEPSEEK) {
            new Setting(containerEl)
                .setName('DeepSeek API key')
                .setDesc('Your DeepSeek API key')
                .addText(text => text
                    .setPlaceholder('sk-...')
                    .setValue(this.plugin.settings.deepseekApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.deepseekApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            new Setting(containerEl)
                .setName('Model')
                .setDesc('DeepSeek model ID')
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
