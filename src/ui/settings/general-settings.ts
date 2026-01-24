import { PluginSettings, TranscriptionProvider, LLMProvider, InsertPosition } from '../../types/config';
import ASRPlugin from '../../main';
import { Setting, SettingTab } from 'obsidian';

export class GeneralSettingsTab {
    constructor(private containerEl: HTMLElement, private plugin: ASRPlugin) {}

    display(): void {
        new Setting(this.containerEl)
            .setName('General Settings')
            .setHeading();

        new Setting(this.containerEl)
            .setName('Audio save folder')
            .setDesc('Folder where recorded audio files will be saved')
            .addText(text => text
                .setPlaceholder('/')
                .setValue(this.plugin.settings.audioSaveFolder)
                .onChange(async (value) => {
                    this.plugin.settings.audioSaveFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('Voice note folder')
            .setDesc('Folder where new voice notes will be created')
            .addText(text => text
                .setPlaceholder('/')
                .setValue(this.plugin.settings.voiceNoteFolder)
                .onChange(async (value) => {
                    this.plugin.settings.voiceNoteFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('AI action note folder')
            .setDesc('Folder where AI generated notes (e.g. from Sidebar) will be created')
            .addText(text => text
                .setPlaceholder('思维涌现')
                .setValue(this.plugin.settings.aiActionNoteFolder)
                .onChange(async (value) => {
                    this.plugin.settings.aiActionNoteFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('Template file path')
            .setDesc('Path to the template file for new voice notes (e.g., templates/voice-note.md)')
            .addText(text => text
                .setPlaceholder('templates/voice-note.md')
                .setValue(this.plugin.settings.templatePath)
                .onChange(async (value) => {
                    this.plugin.settings.templatePath = value;
                    await this.plugin.saveSettings();
                }));
        
        // Insertion Settings
        new Setting(this.containerEl)
            .setName('Insertion')
            .setHeading();

        new Setting(this.containerEl)
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

        new Setting(this.containerEl)
            .setName('Add timestamp')
            .setDesc('Prepend a timestamp to the transcribed text')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.addTimestamp)
                .onChange(async (value) => {
                    this.plugin.settings.addTimestamp = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('Add separator')
            .setDesc('Add a separator before the transcribed text')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.addSeparator)
                .onChange(async (value) => {
                    this.plugin.settings.addSeparator = value;
                    await this.plugin.saveSettings();
                }));
    }
}
