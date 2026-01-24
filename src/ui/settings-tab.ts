import { App, PluginSettingTab, Setting } from 'obsidian';
import ASRPlugin from '../main';
import { GeneralSettingsTab } from './settings/general-settings';
import { TranscriptionSettingsTab } from './settings/transcription-settings';
import { LLMSettingsTab } from './settings/llm-settings';

export class ASRSettingTab extends PluginSettingTab {
    plugin: ASRPlugin;

    constructor(app: App, plugin: ASRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const refresh = () => this.display();

        // 1. General Settings
        new GeneralSettingsTab(containerEl, this.plugin).display();

        // 2. Transcription Settings
        new TranscriptionSettingsTab(containerEl, this.plugin, refresh).display();

        // 3. LLM Settings
        new LLMSettingsTab(containerEl, this.plugin, refresh).display();

        // 4. Features Settings (AI Polishing, etc)
        new Setting(containerEl)
            .setName('Features')
            .setHeading();

        new Setting(containerEl)
            .setName('AI polishing')
            .setDesc('Automatically polish transcribed text using the configured LLM provider')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableAiPolishing)
                .onChange(async (value) => {
                    this.plugin.settings.enableAiPolishing = value;
                    await this.plugin.saveSettings();
                    refresh();
                }));

        if (this.plugin.settings.enableAiPolishing) {
             new Setting(containerEl)
                .setName('System prompt')
                .setDesc('Instructions for the AI on how to polish the text')
                .addTextArea(text => text
                    .setPlaceholder('You are a helpful assistant...')
                    .setValue(this.plugin.settings.systemPrompt)
                    .onChange(async (value) => {
                        this.plugin.settings.systemPrompt = value;
                        await this.plugin.saveSettings();
                    })
                    .inputEl.rows = 5);
        }

        // 5. Advanced Settings
        new Setting(containerEl)
            .setName('Advanced')
            .setHeading();

        new Setting(containerEl)
            .setName('Debug logging')
            .setDesc('Enable debug logging to console')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.debugLogging)
                .onChange(async (value) => {
                    this.plugin.settings.debugLogging = value;
                    await this.plugin.saveSettings();
                }));
        
        new Setting(containerEl)
            .setName('Retry count')
            .setDesc('Number of times to retry failed API calls')
            .addSlider(slider => slider
                .setLimits(0, 5, 1)
                .setValue(this.plugin.settings.retryCount)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.retryCount = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Timeout (ms)')
            .setDesc('API request timeout in milliseconds')
            .addText(text => text
                .setPlaceholder('30000')
                .setValue(this.plugin.settings.timeout.toString())
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num)) {
                        this.plugin.settings.timeout = num;
                        await this.plugin.saveSettings();
                    }
                }));
    }
}