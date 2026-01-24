import { TranscriptionProvider } from '../../types/config';
import ASRPlugin from '../../main';
import { Setting } from 'obsidian';

export class TranscriptionSettingsTab {
    constructor(private containerEl: HTMLElement, private plugin: ASRPlugin, private refresh: () => void) {}

    display(): void {
        new Setting(this.containerEl)
            .setName('Transcription (ASR)')
            .setHeading();

        new Setting(this.containerEl)
            .setName('Provider')
            .setDesc('Choose the speech-to-text provider')
            .addDropdown(dropdown => dropdown
                .addOption(TranscriptionProvider.ZHIPU, 'Zhipu AI (glm-asr-2512)')
                .addOption(TranscriptionProvider.VOLCENGINE, 'VolcEngine doubao')
                .setValue(this.plugin.settings.transcriptionProvider)
                .onChange(async (value) => {
                    this.plugin.settings.transcriptionProvider = value as TranscriptionProvider;
                    await this.plugin.saveSettings();
                    this.refresh();
                }));

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.ZHIPU) {
            new Setting(this.containerEl)
                .setName('Zhipu API key')
                .setDesc('API Key for Zhipu AI')
                .addText(text => text
                    .setPlaceholder('Enter your API key')
                    .setValue(this.plugin.settings.zhipuApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.zhipuApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');
        }

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.VOLCENGINE) {
            new Setting(this.containerEl)
                .setName('App ID')
                .setDesc('VolcEngine App ID')
                .addText(text => text
                    .setPlaceholder('Enter your app ID')
                    .setValue(this.plugin.settings.volcengineAppId)
                    .onChange(async (value) => {
                        this.plugin.settings.volcengineAppId = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(this.containerEl)
                .setName('Access token')
                .setDesc('VolcEngine Access Token')
                .addText(text => text
                    .setPlaceholder('Enter your access token')
                    .setValue(this.plugin.settings.volcengineAccessToken)
                    .onChange(async (value) => {
                        this.plugin.settings.volcengineAccessToken = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');
        }

        new Setting(this.containerEl)
            .setName('Context prompt')
            .setDesc('Provide context to improve transcription accuracy')
            .addTextArea(text => text
                .setPlaceholder('E.g., this is a technical meeting about...')
                .setValue(this.plugin.settings.contextPrompt)
                .onChange(async (value) => {
                    this.plugin.settings.contextPrompt = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('Hotwords')
            .setDesc('Comma-separated list of words to prioritize (e.g., specialized terms)')
            .addText(text => text
                .setPlaceholder('Word1, word2')
                .setValue(this.plugin.settings.hotwords.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.hotwords = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    await this.plugin.saveSettings();
                }));
    }
}
