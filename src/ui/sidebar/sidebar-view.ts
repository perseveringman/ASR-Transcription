import { ItemView, WorkspaceLeaf, setIcon, ButtonComponent, DropdownComponent, Setting } from 'obsidian';
import { ActionManager } from '../../managers/action-manager';
import { SourceConfig, SourceType } from '../../types/action';

export const VIEW_TYPE_AI_SIDEBAR = 'asr-ai-sidebar-view';

export class AISidebarView extends ItemView {
    private currentSourceType: SourceType = 'current-note';

    constructor(leaf: WorkspaceLeaf, private actionManager: ActionManager) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_AI_SIDEBAR;
    }

    getDisplayText() {
        return 'AI Actions';
    }

    getIcon() {
        return 'bot';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('asr-ai-sidebar-container');

        // Header
        const header = container.createEl('div', { cls: 'asr-sidebar-header' });
        header.createEl('h4', { text: 'AI Shortcuts' });

        // Source Selector
        const sourceDiv = container.createEl('div', { cls: 'asr-source-selector' });
        new Setting(sourceDiv)
            .setName('Source')
            .setDesc('Select content source for actions')
            .addDropdown(dropdown => dropdown
                .addOption('current-note', 'Current Note')
                .addOption('date-range', 'Time Range')
                .setValue(this.currentSourceType)
                .onChange((value) => {
                    this.currentSourceType = value as SourceType;
                }));

        // Categories
        const categories = this.actionManager.getCategories();
        
        for (const category of categories) {
            const catDiv = container.createEl('div', { cls: 'asr-category-section' });
            
            // Category Title
            const catTitle = catDiv.createEl('div', { cls: 'asr-category-title' });
            catTitle.createEl('span', { text: category.name });
            
            // Actions
            const actionsDiv = catDiv.createEl('div', { cls: 'asr-actions-list' });
            
            for (const action of category.actions) {
                const actionBtn = actionsDiv.createEl('button', { cls: 'asr-action-button' });
                
                if (action.icon) {
                    const iconSpan = actionBtn.createSpan({ cls: 'asr-action-icon' });
                    setIcon(iconSpan, action.icon);
                }
                
                actionBtn.createSpan({ text: action.name, cls: 'asr-action-name' });

                if (action.description) {
                    actionBtn.setAttribute('aria-label', action.description);
                }

                actionBtn.onclick = () => {
                    const sourceConfig: SourceConfig = {
                        type: this.currentSourceType
                    };
                    this.actionManager.executeAction(action, sourceConfig);
                };
            }
        }
    }

    async onClose() {
        // Cleanup if needed
    }
}
