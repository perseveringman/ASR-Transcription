import { App, Modal, Setting } from 'obsidian';
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
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('prompt-edit-modal');

        contentEl.createEl('h2', { text: `Edit Prompt: ${this.actionName}` });

        const defaultPrompt = DEFAULT_PROMPTS[this.actionId] || 'No default prompt found.';

        // Read-only Default Prompt
        contentEl.createEl('div', { text: 'Default Prompt (Reference)', cls: 'setting-item-name' });
        const defaultArea = contentEl.createEl('textarea', { cls: 'prompt-textarea default-prompt' });
        defaultArea.value = defaultPrompt;
        defaultArea.readOnly = true;
        defaultArea.rows = 6;
        defaultArea.style.width = '100%';
        defaultArea.style.backgroundColor = 'var(--background-secondary)';
        defaultArea.style.color = 'var(--text-muted)';

        contentEl.createEl('hr');

        // Editable Custom Prompt
        contentEl.createEl('div', { text: 'Custom Prompt (Override)', cls: 'setting-item-name' });
        contentEl.createEl('div', { text: 'Leave empty to use the default prompt.', cls: 'setting-item-description' });
        
        const customArea = contentEl.createEl('textarea', { cls: 'prompt-textarea custom-prompt' });
        customArea.value = this.customPrompt;
        customArea.placeholder = 'Enter your custom prompt here...';
        customArea.rows = 10;
        customArea.style.width = '100%';
        
        customArea.oninput = (e) => {
            const target = e.target as HTMLTextAreaElement;
            this.customPrompt = target.value;
        };

        const buttonContainer = contentEl.createEl('div', { cls: 'modal-button-container' });

        // Reset Button
        new Setting(buttonContainer)
            .addButton(btn => btn
                .setButtonText('Reset to Default')
                .setWarning()
                .onClick(async () => {
                    this.customPrompt = '';
                    customArea.value = '';
                    delete this.plugin.settings.customPrompts[this.actionId];
                    await this.plugin.saveSettings();
                    this.close();
                }));

        // Save Button
        new Setting(buttonContainer)
            .addButton(btn => btn
                .setButtonText('Save Custom Prompt')
                .setCta()
                .onClick(async () => {
                    if (this.customPrompt.trim()) {
                        this.plugin.settings.customPrompts[this.actionId] = this.customPrompt.trim();
                    } else {
                        delete this.plugin.settings.customPrompts[this.actionId];
                    }
                    await this.plugin.saveSettings();
                    this.close();
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
