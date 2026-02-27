import { App, PluginSettingTab } from 'obsidian';
import ASRPlugin from '../main';
import { OnboardingWizard } from './settings/onboarding-wizard';
import { renderSettingsShell } from './settings/settings-shell';
import { getInitialSettingsMode } from './settings/settings-state';

export class ASRSettingTab extends PluginSettingTab {
    plugin: ASRPlugin;
    private wizardStep = 0;

    constructor(app: App, plugin: ASRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const refresh = () => this.display();
        const mode = getInitialSettingsMode(this.plugin.settings);

        if (mode === 'wizard') {
            new OnboardingWizard(
                containerEl,
                this.plugin,
                refresh,
                this.wizardStep,
                (step) => {
                    this.wizardStep = Math.max(0, Math.min(2, step));
                },
            ).display();
            return;
        }

        this.wizardStep = 0;

        renderSettingsShell({
            containerEl,
            plugin: this.plugin,
            refresh,
        });
    }
}
