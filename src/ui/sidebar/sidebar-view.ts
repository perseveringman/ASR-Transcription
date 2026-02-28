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
        return 'AI 操作';
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
        header.createEl('h4', { text: 'AI 快捷操作' });

        // Source Selector
        const sourceDiv = container.createEl('div', { cls: 'asr-source-selector' });
        new Setting(sourceDiv)
            .setName('内容来源')
            .setDesc('选择操作的内容来源')
            .addDropdown(dropdown => dropdown
                .addOption('current-note', '当前笔记')
                .addOption('selection', '选中内容')
                .addOption('current-folder', '当前文件夹')
                .addOption('tag', '标签（所有笔记）')
                .addOption('date-range', '时间范围')
                .setValue(this.currentSourceType)
                .onChange((value) => {
                    this.currentSourceType = value as SourceType;
                }));

        // Commonly Used Actions
        const frequentActions = this.actionManager.getMostFrequentActions(4);
        if (frequentActions.length > 0) {
            const freqDiv = container.createEl('div', { cls: 'asr-root-section asr-frequent-section' });
            
            const freqTitle = freqDiv.createEl('div', { cls: 'asr-root-title' });
            freqTitle.createEl('span', { text: '🔥 常用 (Commonly Used)' });

            const actionsDiv = freqDiv.createEl('div', { cls: 'asr-actions-list' });
                
            for (const action of frequentActions) {
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

        // Categories
        const rootCategories = this.actionManager.getCategories();
        
        for (const rootCat of rootCategories) {
            const rootDiv = container.createEl('div', { cls: 'asr-root-section' });
            
            // Level 1: Root Title
            const rootTitle = rootDiv.createEl('div', { cls: 'asr-root-title' });
            rootTitle.createEl('span', { text: rootCat.name });

            for (const subCat of rootCat.subCategories) {
                const subDiv = rootDiv.createEl('div', { cls: 'asr-sub-section' });

                // Level 2: Sub Title
                const subTitle = subDiv.createEl('div', { cls: 'asr-sub-title' });
                subTitle.createEl('span', { text: subCat.name });
                
                // Actions
                const actionsDiv = subDiv.createEl('div', { cls: 'asr-actions-list' });
                
                for (const action of subCat.actions) {
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
    }

    async onClose() {
        // Cleanup if needed
    }
}
