import { Notice, Setting } from 'obsidian';
import ASRPlugin from '../../main';
import { LLMProvider, TranscriptionProvider } from '../../types/config';
import { validateAsrStep, validateLlmStep } from './settings-state';

export class OnboardingWizard {
    constructor(
        private containerEl: HTMLElement,
        private plugin: ASRPlugin,
        private refresh: () => void,
        private stepIndex: number,
        private setStepIndex: (step: number) => void,
    ) {}

    display(): void {
        const titleSetting = new Setting(this.containerEl)
            .setName('快速配置向导')
            .setHeading();

        titleSetting.setDesc(`步骤 ${this.stepIndex + 1}/3：${this.getStepTitle(this.stepIndex)}`);

        if (this.stepIndex === 0) {
            this.displayAsrStep();
            return;
        }

        if (this.stepIndex === 1) {
            this.displayLlmStep();
            return;
        }

        this.displayGeneralStep();
    }

    private getStepTitle(step: number): string {
        if (step === 0) return '配置转录 ASR';
        if (step === 1) return '配置智能 LLM';
        return '确认常用设置并完成';
    }

    private displayAsrStep() {
        new Setting(this.containerEl)
            .setName('语音转写服务商')
            .setDesc('选择语音转文字服务')
            .addDropdown(dropdown => dropdown
                .addOption(TranscriptionProvider.ZHIPU, 'Zhipu (glm-asr-2512)')
                .addOption(TranscriptionProvider.VOLCENGINE, 'Volcengine doubao')
                .addOption(TranscriptionProvider.LOCAL_WHISPER, '本地 whisper')
                .setValue(this.plugin.settings.transcriptionProvider)
                .onChange(async (value) => {
                    this.plugin.settings.transcriptionProvider = value as TranscriptionProvider;
                    await this.plugin.saveSettings();
                    this.refresh();
                }));

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.ZHIPU) {
            new Setting(this.containerEl)
                .setName('Zhipu API 密钥')
                .setDesc('填写 zhipu 转写密钥')
                .addText(text => text
                    .setPlaceholder('请输入 API 密钥')
                    .setValue(this.plugin.settings.zhipuApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.zhipuApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');
        }

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.VOLCENGINE) {
            new Setting(this.containerEl)
                .setName('应用 ID')
                .setDesc('填写 volcengine 应用 ID')
                .addText(text => text
                    .setPlaceholder('请输入应用 ID')
                    .setValue(this.plugin.settings.volcengineAppId)
                    .onChange(async (value) => {
                        this.plugin.settings.volcengineAppId = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(this.containerEl)
                .setName('访问令牌')
                .setDesc('填写 volcengine 访问令牌')
                .addText(text => text
                    .setPlaceholder('请输入访问令牌')
                    .setValue(this.plugin.settings.volcengineAccessToken)
                    .onChange(async (value) => {
                        this.plugin.settings.volcengineAccessToken = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');
        }

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.LOCAL_WHISPER) {
            new Setting(this.containerEl)
                .setName('服务地址')
                .setDesc('填写本地服务地址，例如 localhost:9000')
                .addText(text => text
                    .setPlaceholder('例如 localhost:9000')
                    .setValue(this.plugin.settings.whisperServerUrl)
                    .onChange(async (value) => {
                        this.plugin.settings.whisperServerUrl = value.trim();
                        await this.plugin.saveSettings();
                    }));
        }

        const errorEl = this.containerEl.createDiv({ cls: 'asr-wizard-errors' });

        new Setting(this.containerEl)
            .addButton(button => button
                .setButtonText('下一步')
                .setCta()
                .onClick(() => {
                    const result = validateAsrStep(this.plugin.settings);
                    if (!result.valid) {
                        errorEl.setText(result.errors.join('；'));
                        return;
                    }
                    errorEl.empty();
                    this.setStepIndex(1);
                    this.refresh();
                }))
            .addButton(button => button
                .setButtonText('暂时跳过')
                .onClick(async () => {
                    this.plugin.settings.settingsViewMode = 'tabs';
                    this.plugin.settings.lastActiveTab = 'quickstart';
                    await this.plugin.saveSettings();
                    this.refresh();
                }));
    }

    private displayLlmStep() {
        new Setting(this.containerEl)
            .setName('全局模型服务商')
            .setDesc('选择默认模型服务商')
            .addDropdown(dropdown => dropdown
                .addOption(LLMProvider.OPENROUTER, 'Openrouter')
                .addOption(LLMProvider.GEMINI, 'Google gemini')
                .addOption(LLMProvider.OPENAI, 'Openai')
                .addOption(LLMProvider.ANTHROPIC, 'Anthropic claude')
                .addOption(LLMProvider.ZHIPU, 'Zhipu')
                .addOption(LLMProvider.MINIMAX, 'Minimax')
                .addOption(LLMProvider.DEEPSEEK, 'Deepseek')
                .setValue(this.plugin.settings.llmProvider)
                .onChange(async (value) => {
                    this.plugin.settings.llmProvider = value as LLMProvider;
                    await this.plugin.saveSettings();
                    this.refresh();
                }));

        this.renderLlmKeyField();

        const errorEl = this.containerEl.createDiv({ cls: 'asr-wizard-errors' });

        new Setting(this.containerEl)
            .addButton(button => button
                .setButtonText('上一步')
                .onClick(() => {
                    this.setStepIndex(0);
                    this.refresh();
                }))
            .addButton(button => button
                .setButtonText('下一步')
                .setCta()
                .onClick(() => {
                    const result = validateLlmStep(this.plugin.settings);
                    if (!result.valid) {
                        errorEl.setText(result.errors.join('；'));
                        return;
                    }
                    errorEl.empty();
                    this.setStepIndex(2);
                    this.refresh();
                }));
    }

    private renderLlmKeyField() {
        const provider = this.plugin.settings.llmProvider;

        if (provider === LLMProvider.OPENROUTER) {
            this.renderKeyField('OpenRouter API key', this.plugin.settings.openRouterApiKey, async (value) => {
                this.plugin.settings.openRouterApiKey = value;
            });
            return;
        }

        if (provider === LLMProvider.GEMINI) {
            this.renderKeyField('Gemini API key', this.plugin.settings.geminiApiKey, async (value) => {
                this.plugin.settings.geminiApiKey = value;
            });
            return;
        }

        if (provider === LLMProvider.OPENAI) {
            this.renderKeyField('OpenAI API key', this.plugin.settings.openAIApiKey, async (value) => {
                this.plugin.settings.openAIApiKey = value;
            });
            return;
        }

        if (provider === LLMProvider.ANTHROPIC) {
            this.renderKeyField('Anthropic API key', this.plugin.settings.anthropicApiKey, async (value) => {
                this.plugin.settings.anthropicApiKey = value;
            });
            return;
        }

        if (provider === LLMProvider.ZHIPU) {
            this.renderKeyField('Zhipu LLM API key', this.plugin.settings.zhipuLLMApiKey, async (value) => {
                this.plugin.settings.zhipuLLMApiKey = value;
            });
            return;
        }

        if (provider === LLMProvider.MINIMAX) {
            this.renderKeyField('Minimax API key', this.plugin.settings.minimaxApiKey, async (value) => {
                this.plugin.settings.minimaxApiKey = value;
            });
            return;
        }

        this.renderKeyField('DeepSeek API key', this.plugin.settings.deepseekApiKey, async (value) => {
            this.plugin.settings.deepseekApiKey = value;
        });
    }

    private renderKeyField(
        name: string,
        value: string,
        onSave: (value: string) => Promise<void>,
    ) {
        new Setting(this.containerEl)
            .setName(name)
            .setDesc('该项为必填')
            .addText(text => text
                .setPlaceholder('请输入 API 密钥')
                .setValue(value)
                .onChange(async (input) => {
                    await onSave(input.trim());
                    await this.plugin.saveSettings();
                })
                .inputEl.type = 'password');
    }

    private displayGeneralStep() {
        new Setting(this.containerEl)
            .setName('语音笔记文件夹')
            .setDesc('转录内容默认写入目录')
            .addText(text => text
                .setPlaceholder('/')
                .setValue(this.plugin.settings.voiceNoteFolder)
                .onChange(async (value) => {
                    this.plugin.settings.voiceNoteFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('音频保存文件夹')
            .setDesc('录音文件默认保存目录')
            .addText(text => text
                .setPlaceholder('/')
                .setValue(this.plugin.settings.audioSaveFolder)
                .onChange(async (value) => {
                    this.plugin.settings.audioSaveFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('自动转写新音频')
            .setDesc('保存到音频文件夹后自动触发转写')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableAutoTranscription)
                .onChange(async (value) => {
                    this.plugin.settings.enableAutoTranscription = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .addButton(button => button
                .setButtonText('上一步')
                .onClick(() => {
                    this.setStepIndex(1);
                    this.refresh();
                }))
            .addButton(button => button
                .setButtonText('完成并进入设置')
                .setCta()
                .onClick(async () => {
                    this.plugin.settings.onboardingCompleted = true;
                    this.plugin.settings.settingsViewMode = 'tabs';
                    this.plugin.settings.lastActiveTab = 'quickstart';
                    await this.plugin.saveSettings();
                    this.setStepIndex(0);
                    new Notice('配置向导已完成');
                    this.refresh();
                }));
    }
}
