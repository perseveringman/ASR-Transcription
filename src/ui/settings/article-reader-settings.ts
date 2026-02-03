import { Setting } from 'obsidian';
import ASRPlugin from '../../main';

export class ArticleReaderSettingsTab {
    private containerEl: HTMLElement;
    private plugin: ASRPlugin;
    private refresh: () => void;

    constructor(containerEl: HTMLElement, plugin: ASRPlugin, refresh: () => void) {
        this.containerEl = containerEl;
        this.plugin = plugin;
        this.refresh = refresh;
    }

    display(): void {
        new Setting(this.containerEl)
            .setName('Article reader')
            .setHeading();

        new Setting(this.containerEl)
            .setName('Enable article reader')
            .setDesc('Enable URL detection and article analysis features')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableArticleReader)
                .onChange(async (value) => {
                    this.plugin.settings.enableArticleReader = value;
                    await this.plugin.saveSettings();
                    this.refresh();
                }));

        if (!this.plugin.settings.enableArticleReader) {
            return;
        }

        new Setting(this.containerEl)
            .setName('Auto-trigger on paste')
            .setDesc('Automatically analyze URLs when pasting into notes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.articleReaderAutoTrigger)
                .onChange(async (value) => {
                    this.plugin.settings.articleReaderAutoTrigger = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('Jina API key')
            .setDesc('If set, use Jina Reader to fetch article content. Otherwise, let AI directly analyze the URL.')
            .addText(text => text
                .setPlaceholder('jina_xxxxxx (optional)')
                .setValue(this.plugin.settings.jinaApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.jinaApiKey = value;
                    await this.plugin.saveSettings();
                })
                .inputEl.type = 'password');

        new Setting(this.containerEl)
            .setName('Article notes folder')
            .setDesc('Folder to save generated article notes')
            .addText(text => text
                .setPlaceholder('Articles')
                .setValue(this.plugin.settings.articleNoteFolder)
                .onChange(async (value) => {
                    this.plugin.settings.articleNoteFolder = value || 'Articles';
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('Analysis prompt')
            .setDesc('System prompt for article analysis. Leave empty for default.')
            .addTextArea(text => {
                text.setPlaceholder('You are a professional article reading assistant...')
                    .setValue(this.plugin.settings.articleReaderSystemPrompt)
                    .onChange(async (value) => {
                        this.plugin.settings.articleReaderSystemPrompt = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 6;
                text.inputEl.style.width = '100%';
            });
    }
}
