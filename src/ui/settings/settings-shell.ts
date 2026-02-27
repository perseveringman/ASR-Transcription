import ASRPlugin from '../../main';
import { GeneralSettingsTab } from './general-settings';
import { TranscriptionSettingsTab } from './transcription-settings';
import { LLMSettingsTab } from './llm-settings';
import { ArticleReaderSettingsTab } from './article-reader-settings';
import { SETTINGS_TABS, SettingsTabId } from './settings-tabs';
import { QuickstartSettingsTab } from './quickstart-settings';
import { AIAdvancedSettingsTab } from './ai-advanced-settings';
import { AdvancedSettingsTab } from './advanced-settings';

interface RenderSettingsShellOptions {
    containerEl: HTMLElement;
    plugin: ASRPlugin;
    refresh: () => void;
}

function getCurrentTabId(plugin: ASRPlugin): SettingsTabId {
    const activeTab = plugin.settings.lastActiveTab;
    const validIds: SettingsTabId[] = ['quickstart', 'asr', 'llm', 'ai-advanced', 'general-advanced'];

    if (validIds.includes(activeTab)) {
        return activeTab;
    }

    return 'quickstart';
}

export function renderSettingsShell(options: RenderSettingsShellOptions): void {
    const { containerEl, plugin, refresh } = options;
    const activeTab = getCurrentTabId(plugin);

    const shellEl = containerEl.createDiv({ cls: 'asr-settings-shell' });
    const tabsEl = shellEl.createDiv({ cls: 'asr-settings-tabs' });

    for (const tab of SETTINGS_TABS) {
        const button = tabsEl.createEl('button', {
            text: tab.label,
            cls: `asr-settings-tab-btn ${tab.id === activeTab ? 'is-active' : ''}`,
        });

        button.type = 'button';
        button.title = tab.description;

        button.addEventListener('click', async () => {
            if (tab.id === activeTab) {
                return;
            }
            plugin.settings.lastActiveTab = tab.id;
            plugin.settings.settingsViewMode = 'tabs';
            await plugin.saveSettings();
            refresh();
        });
    }

    const contentEl = shellEl.createDiv({ cls: 'asr-settings-content' });

    if (activeTab === 'quickstart') {
        new QuickstartSettingsTab(contentEl, plugin, refresh).display();
        return;
    }

    if (activeTab === 'asr') {
        new TranscriptionSettingsTab(contentEl, plugin, refresh).display();
        return;
    }

    if (activeTab === 'llm') {
        new LLMSettingsTab(contentEl, plugin, refresh).display();
        return;
    }

    if (activeTab === 'ai-advanced') {
        new AIAdvancedSettingsTab(contentEl, plugin, refresh).display();
        return;
    }

    new GeneralSettingsTab(contentEl, plugin).display();
    new ArticleReaderSettingsTab(contentEl, plugin, refresh).display();
    new AdvancedSettingsTab(contentEl, plugin).display();
}
