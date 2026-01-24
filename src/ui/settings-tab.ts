import { App, PluginSettingTab, Setting } from 'obsidian';
import ASRPlugin from '../main';
import { InsertPosition, TranscriptionProvider } from '../types/config';

export class ASRSettingTab extends PluginSettingTab {
    plugin: ASRPlugin;

    constructor(app: App, plugin: ASRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Asr voice transcription')
            .setHeading();

        new Setting(containerEl)
            .setName('Transcription provider')
            .setDesc('Choose the ai provider for transcription')
            .addDropdown(dropdown => dropdown
                .addOption(TranscriptionProvider.ZHIPU, 'Zhipu ai (glm-asr-2512)')
                .addOption(TranscriptionProvider.VOLCENGINE, 'Volcengine doubao (standard edition)')
                .setValue(this.plugin.settings.transcriptionProvider)
                .onChange(async (value) => {
                    this.plugin.settings.transcriptionProvider = value as TranscriptionProvider;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide relevant fields
                }));

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.ZHIPU) {
            new Setting(containerEl)
                .setName('Zhipu api key')
                .setDesc('Your zhipu ai api key')
                .addText(text => text
                    .setPlaceholder('Enter your api key')
                    .setValue(this.plugin.settings.zhipuApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.zhipuApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');
        }

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.VOLCENGINE) {
            new Setting(containerEl)
                .setName('Volcengine app id')
                .setDesc('Your volcengine app id')
                .addText(text => text
                    .setPlaceholder('Enter your app id')
                    .setValue(this.plugin.settings.volcengineAppId)
                    .onChange(async (value) => {
                        this.plugin.settings.volcengineAppId = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Volcengine access token')
                .setDesc('Your volcengine access token')
                .addText(text => text
                    .setPlaceholder('Enter your access token')
                    .setValue(this.plugin.settings.volcengineAccessToken)
                    .onChange(async (value) => {
                        this.plugin.settings.volcengineAccessToken = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');
        }

        new Setting(containerEl)
            .setName('Insertion')
            .setHeading();

        new Setting(containerEl)
            .setName('Insert position')
            .setDesc('Where to insert the transcribed text')
            .addDropdown(dropdown => dropdown
                .addOption(InsertPosition.CURSOR, 'At cursor')
                .addOption(InsertPosition.DOCUMENT_END, 'At document end')
                .addOption(InsertPosition.NEW_NOTE, 'In a new note')
                .setValue(this.plugin.settings.insertPosition)
                .onChange(async (value) => {
                    this.plugin.settings.insertPosition = value as InsertPosition;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Add timestamp')
            .setDesc('Prepend a timestamp to the transcribed text')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.addTimestamp)
                .onChange(async (value) => {
                    this.plugin.settings.addTimestamp = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Add separator')
            .setDesc('Add a separator before the transcribed text')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.addSeparator)
                .onChange(async (value) => {
                    this.plugin.settings.addSeparator = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Storage')
            .setHeading();

        new Setting(containerEl)
            .setName('Audio save folder')
            .setDesc('Folder where recorded audio files will be saved')
            .addText(text => text
                .setPlaceholder('/')
                .setValue(this.plugin.settings.audioSaveFolder)
                .onChange(async (value) => {
                    this.plugin.settings.audioSaveFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Voice note folder')
            .setDesc('Folder where new voice notes will be created')
            .addText(text => text
                .setPlaceholder('/')
                .setValue(this.plugin.settings.voiceNoteFolder)
                .onChange(async (value) => {
                    this.plugin.settings.voiceNoteFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Template file path')
            .setDesc('Path to the template file for new voice notes (e.g., templates/voice-note.md)')
            .addText(text => text
                .setPlaceholder('templates/voice-note.md')
                .setValue(this.plugin.settings.templatePath)
                .onChange(async (value) => {
                    this.plugin.settings.templatePath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Transcription')
            .setHeading();

        new Setting(containerEl)
            .setName('Context prompt')
            .setDesc('Provide context to improve transcription accuracy')
            .addTextArea(text => text
                .setPlaceholder('e.g., This is a technical meeting about...')
                .setValue(this.plugin.settings.contextPrompt)
                .onChange(async (value) => {
                    this.plugin.settings.contextPrompt = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Hotwords')
            .setDesc('Comma-separated list of words to prioritize (e.g., specialized terms)')
            .addText(text => text
                .setPlaceholder('Word1, word2')
                .setValue(this.plugin.settings.hotwords.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.hotwords = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    await this.plugin.saveSettings();
                }));

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
            .setDesc('Number of times to retry failed api calls')
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
