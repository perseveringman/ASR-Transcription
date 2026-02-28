import { Setting } from 'obsidian';
import ASRPlugin from '../../main';
import { PromptEditModal } from '../modals/prompt-edit-modal';

export class AIAdvancedSettingsTab {
    constructor(
        private containerEl: HTMLElement,
        private plugin: ASRPlugin,
        private refresh: () => void,
    ) {}

    display(): void {
        this.displayPolishingSettings();
        this.displayThinkingModelSettings();
    }

    private displayPolishingSettings() {
        new Setting(this.containerEl)
            .setName('AI 润色')
            .setHeading()
            .setDesc('自动润色转写内容的风格和提示词。');

        new Setting(this.containerEl)
            .setName('启用 AI 润色')
            .setDesc('使用已配置模型对转写文本自动润色')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableAiPolishing)
                .onChange(async (value) => {
                    this.plugin.settings.enableAiPolishing = value;
                    await this.plugin.saveSettings();
                    this.refresh();
                }));

        if (!this.plugin.settings.enableAiPolishing) {
            return;
        }

        new Setting(this.containerEl)
            .setName('润色风格')
            .setDesc('选择用于润色的风格预设')
            .addDropdown(dropdown => {
                this.plugin.settings.stylePresets.forEach((preset) => {
                    dropdown.addOption(preset.id, preset.name);
                });
                dropdown.setValue(this.plugin.settings.selectedStylePresetId || 'default');
                dropdown.onChange(async (value) => {
                    this.plugin.settings.selectedStylePresetId = value;
                    await this.plugin.saveSettings();
                    this.refresh();
                });
            });

        const currentPreset = this.plugin.settings.stylePresets.find(
            p => p.id === this.plugin.settings.selectedStylePresetId,
        ) || this.plugin.settings.stylePresets[0];

        if (!currentPreset) {
            return;
        }

        new Setting(this.containerEl)
            .setName('风格提示词')
            .setDesc(`自定义“${currentPreset.name}”的提示词`)
            .addTextArea(text => {
                text.setPlaceholder('在此输入该风格的系统提示词...')
                    .setValue(currentPreset.prompt)
                    .onChange(async (value) => {
                        currentPreset.prompt = value;
                        if (currentPreset.id === 'default') {
                            this.plugin.settings.systemPrompt = value;
                        }
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 8;
            });
    }

    private displayThinkingModelSettings() {
        new Setting(this.containerEl)
            .setName('Thinking 模型配置')
            .setHeading()
            .setDesc('自定义各类思维操作的系统提示词。');

        const categories = this.plugin.actionManager.getCategories();

        for (const category of categories) {
            const details = this.containerEl.createEl('details', {
                cls: 'asr-thinking-category',
            });
            details.createEl('summary', {
                text: category.name,
                cls: 'asr-thinking-category-summary',
            });

            const categoryContent = details.createDiv({ cls: 'asr-thinking-category-content' });

            for (const sub of category.subCategories) {
                categoryContent.createEl('div', {
                    text: sub.name,
                    cls: 'asr-thinking-subcategory-label',
                });

                for (const action of sub.actions) {
                    const isCustomized = !!this.plugin.settings.customPrompts[action.id];

                    new Setting(categoryContent)
                        .setName(action.name)
                        .setDesc(action.description || '')
                        .addExtraButton(btn => btn
                            .setIcon('pencil')
                            .setTooltip('编辑系统提示词')
                            .onClick(() => {
                                new PromptEditModal(this.plugin.app, this.plugin, action.id, action.name).open();
                            }))
                        .addExtraButton(btn => {
                            btn.setIcon('reset')
                                .setTooltip('恢复默认')
                                .setDisabled(!isCustomized)
                                .onClick(async () => {
                                    delete this.plugin.settings.customPrompts[action.id];
                                    await this.plugin.saveSettings();
                                    this.refresh();
                                });

                            if (isCustomized) {
                                btn.extraSettingsEl.addClass('asr-thinking-customized-btn');
                            }
                        });
                }
            }
        }
    }
}
