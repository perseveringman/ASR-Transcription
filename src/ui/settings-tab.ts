import { App, PluginSettingTab, Setting } from 'obsidian';
import ASRPlugin from '../main';
import { InsertPosition } from '../types/config';

export class ASRSettingTab extends PluginSettingTab {
    plugin: ASRPlugin;

    constructor(app: App, plugin: ASRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'ASR Voice Transcription Settings' });

        new Setting(containerEl)
            .setName('Zhipu API Key')
            .setDesc('Your Zhipu AI API Key (GLM-ASR-2512)')
            .addText(text => text
                .setPlaceholder('Enter your API Key')
                .setValue(this.plugin.settings.zhipuApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.zhipuApiKey = value.trim();
                    await this.plugin.saveSettings();
                })
                .inputEl.type = 'password');

        containerEl.createEl('h3', { text: 'Insertion Settings' });

        new Setting(containerEl)
            .setName('Insert Position')
            .setDesc('Where to insert the transcribed text')
            .addDropdown(dropdown => dropdown
                .addOption(InsertPosition.CURSOR, 'At cursor')
                .addOption(InsertPosition.DOCUMENT_END, 'At document end')
                .addOption(InsertPosition.NEW_NOTE, 'In a new note')
                .setValue(this.plugin.settings.insertPosition)
                .onChange(async (value) => {
                    this.plugin.settings.insertPosition = value as InsertPosition;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide folder setting
                }));

        if (this.plugin.settings.insertPosition === InsertPosition.NEW_NOTE) {
            new Setting(containerEl)
                .setName('New Note Folder')
                .setDesc('Folder where new notes will be created')
                .addText(text => text
                    .setPlaceholder('/')
                    .setValue(this.plugin.settings.newNoteFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.newNoteFolder = value;
                        await this.plugin.saveSettings();
                    }));
        }

        new Setting(containerEl)
            .setName('Add Timestamp')
            .setDesc('Prepend a timestamp to the transcribed text')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.addTimestamp)
                .onChange(async (value) => {
                    this.plugin.settings.addTimestamp = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Add Separator')
            .setDesc('Add a separator before the transcribed text')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.addSeparator)
                .onChange(async (value) => {
                    this.plugin.settings.addSeparator = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { text: 'Storage Settings' });

        new Setting(containerEl)
            .setName('Audio Save Folder')
            .setDesc('Folder where recorded audio files will be saved')
            .addText(text => text
                .setPlaceholder('/')
                .setValue(this.plugin.settings.audioSaveFolder)
                .onChange(async (value) => {
                    this.plugin.settings.audioSaveFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Transcription Note Folder')
            .setDesc('Folder where new transcription notes will be created')
            .addText(text => text
                .setPlaceholder('/')
                .setValue(this.plugin.settings.newNoteFolder)
                .onChange(async (value) => {
                    this.plugin.settings.newNoteFolder = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { text: 'Transcription Options' });

        new Setting(containerEl)
            .setName('Context Prompt')
            .setDesc('Provide context to improve transcription accuracy')
            .addTextArea(text => text
                .setPlaceholder('e.g. This is a technical meeting about...')
                .setValue(this.plugin.settings.contextPrompt)
                .onChange(async (value) => {
                    this.plugin.settings.contextPrompt = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Hotwords')
            .setDesc('Comma-separated list of words to prioritize (e.g. specialized terms)')
            .addText(text => text
                .setPlaceholder('word1, word2')
                .setValue(this.plugin.settings.hotwords.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.hotwords = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { text: 'Advanced Settings' });

        new Setting(containerEl)
            .setName('Debug Logging')
            .setDesc('Enable debug logging to console')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.debugLogging)
                .onChange(async (value) => {
                    this.plugin.settings.debugLogging = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Retry Count')
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
