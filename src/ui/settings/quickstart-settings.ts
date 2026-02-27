import { Notice, Setting } from 'obsidian';
import ASRPlugin from '../../main';
import { hasAnyCredential, validateAsrStep, validateLlmStep } from './settings-state';

export class QuickstartSettingsTab {
    constructor(
        private containerEl: HTMLElement,
        private plugin: ASRPlugin,
        private refresh: () => void,
    ) {}

    display(): void {
        new Setting(this.containerEl)
            .setName('快速开始')
            .setHeading();

        new Setting(this.containerEl)
            .setName('配置向导')
            .setDesc('首次配置建议使用向导。你可以随时重新进入向导。')
            .addButton(button => button
                .setButtonText('进入向导')
                .setCta()
                .onClick(async () => {
                    this.plugin.settings.settingsViewMode = 'wizard';
                    this.plugin.settings.lastActiveTab = 'quickstart';
                    await this.plugin.saveSettings();
                    this.refresh();
                }));

        const asrValidation = validateAsrStep(this.plugin.settings);
        const llmValidation = validateLlmStep(this.plugin.settings);

        const statusContainer = this.containerEl.createDiv({ cls: 'asr-settings-status-card' });
        statusContainer.createEl('div', {
            text: '当前配置状态',
            cls: 'asr-settings-status-title',
        });

        const list = statusContainer.createEl('ul', { cls: 'asr-settings-status-list' });
        const hasCredential = hasAnyCredential(this.plugin.settings);

        list.createEl('li', {
            text: `凭证检测：${hasCredential ? '已发现配置' : '尚未配置'}`,
        });
        list.createEl('li', {
            text: `ASR 配置：${asrValidation.valid ? '可用' : `待完善（${asrValidation.errors[0]}）`}`,
        });
        list.createEl('li', {
            text: `LLM 配置：${llmValidation.valid ? '可用' : `待完善（${llmValidation.errors[0]}）`}`,
        });

        new Setting(this.containerEl)
            .setName('完成标记')
            .setDesc('开启后将不再自动弹出首次向导（仍可手动进入）。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.onboardingCompleted)
                .onChange(async (value) => {
                    this.plugin.settings.onboardingCompleted = value;
                    if (!value) {
                        this.plugin.settings.settingsViewMode = 'wizard';
                        new Notice('已恢复首次向导模式');
                    }
                    await this.plugin.saveSettings();
                    this.refresh();
                }));
    }
}
