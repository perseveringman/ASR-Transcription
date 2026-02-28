import { App, Modal, ButtonComponent } from 'obsidian';
import { DEFAULT_PROMPTS } from '../../data/default-prompts';
import ASRPlugin from '../../main';

export class PromptEditModal extends Modal {
    private actionId: string;
    private actionName: string;
    private plugin: ASRPlugin;
    private customPrompt: string;

    constructor(app: App, plugin: ASRPlugin, actionId: string, actionName: string) {
        super(app);
        this.plugin = plugin;
        this.actionId = actionId;
        this.actionName = actionName;
        this.customPrompt = this.plugin.settings.customPrompts[this.actionId] || '';
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        modalEl.addClass('prompt-edit-modal');

        // ── Header ──────────────────────────────────────────────
        const header = contentEl.createEl('div', { cls: 'pem-header' });
        header.createEl('div', { cls: 'pem-tag', text: 'Prompt' });
        header.createEl('h3', { cls: 'pem-title', text: this.actionName });

        // ── Default Prompt (read-only) ───────────────────────────
        const defaultPrompt = DEFAULT_PROMPTS[this.actionId] || '（暂无默认提示词）';

        const defaultSection = contentEl.createEl('div', { cls: 'pem-section' });
        const defaultLabel = defaultSection.createEl('div', { cls: 'pem-label' });
        defaultLabel.createEl('span', { text: '默认提示词' });
        defaultLabel.createEl('span', { cls: 'pem-label-badge pem-label-badge--readonly', text: '只读' });

        const defaultArea = defaultSection.createEl('textarea', { cls: 'pem-textarea pem-textarea--readonly' });
        defaultArea.value = defaultPrompt;
        defaultArea.readOnly = true;
        defaultArea.rows = 6;

        // ── Custom Prompt (editable) ─────────────────────────────
        const customSection = contentEl.createEl('div', { cls: 'pem-section' });
        const customLabel = customSection.createEl('div', { cls: 'pem-label' });
        customLabel.createEl('span', { text: '自定义提示词' });
        customLabel.createEl('span', { cls: 'pem-label-badge pem-label-badge--editable', text: '可编辑' });

        customSection.createEl('p', {
            cls: 'pem-hint',
            text: '留空则使用默认提示词',
        });

        const customArea = customSection.createEl('textarea', { cls: 'pem-textarea pem-textarea--editable' });
        customArea.value = this.customPrompt;
        customArea.placeholder = '在此输入自定义提示词…';
        customArea.rows = 10;

        customArea.addEventListener('input', (e) => {
            this.customPrompt = (e.target as HTMLTextAreaElement).value;
        });

        // ── Footer buttons ───────────────────────────────────────
        const footer = contentEl.createEl('div', { cls: 'pem-footer' });

        new ButtonComponent(footer)
            .setButtonText('恢复默认')
            .setClass('pem-btn-reset')
            .onClick(async () => {
                this.customPrompt = '';
                customArea.value = '';
                delete this.plugin.settings.customPrompts[this.actionId];
                await this.plugin.saveSettings();
                this.close();
            });

        new ButtonComponent(footer)
            .setButtonText('保存')
            .setClass('pem-btn-save')
            .setCta()
            .onClick(async () => {
                if (this.customPrompt.trim()) {
                    this.plugin.settings.customPrompts[this.actionId] = this.customPrompt.trim();
                } else {
                    delete this.plugin.settings.customPrompts[this.actionId];
                }
                await this.plugin.saveSettings();
                this.close();
            });
    }

    onClose() {
        this.contentEl.empty();
    }
}
