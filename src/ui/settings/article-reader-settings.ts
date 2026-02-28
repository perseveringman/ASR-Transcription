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
            .setName('文章阅读器')
            .setHeading();

        new Setting(this.containerEl)
            .setName('启用文章阅读器')
            .setDesc('开启 URL 检测和文章分析功能')
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
            .setName('粘贴时自动触发')
            .setDesc('粘贴内容到笔记时自动分析 URL')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.articleReaderAutoTrigger)
                .onChange(async (value) => {
                    this.plugin.settings.articleReaderAutoTrigger = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('Jina API 密钥')
            .setDesc('设置后使用 Jina Reader 获取文章内容，否则让 AI 直接分析 URL。')
            .addText(text => text
                .setPlaceholder('jina_xxxxxx (optional)')
                .setValue(this.plugin.settings.jinaApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.jinaApiKey = value;
                    await this.plugin.saveSettings();
                })
                .inputEl.type = 'password');

        new Setting(this.containerEl)
            .setName('文章笔记文件夹')
            .setDesc('保存生成文章笔记的文件夹')
            .addText(text => text
                .setPlaceholder('Articles')
                .setValue(this.plugin.settings.articleNoteFolder)
                .onChange(async (value) => {
                    this.plugin.settings.articleNoteFolder = value || 'Articles';
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('分析提示词')
            .setDesc('文章分析的系统提示词，留空使用默认。')
            .addTextArea(text => {
                text.setPlaceholder('您是一个专业的文章阅读助手...')
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
