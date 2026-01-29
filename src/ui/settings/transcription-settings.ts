import { TranscriptionProvider } from '../../types/config';
import ASRPlugin from '../../main';
import { Setting } from 'obsidian';

export class TranscriptionSettingsTab {
    constructor(private containerEl: HTMLElement, private plugin: ASRPlugin, private refresh: () => void) {}

    display(): void {
        new Setting(this.containerEl)
            .setName('Transcription (ASR)')
            .setHeading();

        new Setting(this.containerEl)
            .setName('Provider')
            .setDesc('Choose the speech-to-text provider')
            .addDropdown(dropdown => dropdown
                .addOption(TranscriptionProvider.ZHIPU, 'Zhipu AI (glm-asr-2512)')
                .addOption(TranscriptionProvider.VOLCENGINE, 'VolcEngine doubao')
                .addOption(TranscriptionProvider.LOCAL_WHISPER, 'Local Whisper (Self-hosted)')
                .setValue(this.plugin.settings.transcriptionProvider)
                .onChange(async (value) => {
                    this.plugin.settings.transcriptionProvider = value as TranscriptionProvider;
                    await this.plugin.saveSettings();
                    this.refresh();
                }));

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.ZHIPU) {
            new Setting(this.containerEl)
                .setName('Zhipu API key')
                .setDesc('API Key for Zhipu AI')
                .addText(text => text
                    .setPlaceholder('Enter your API key')
                    .setValue(this.plugin.settings.zhipuApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.zhipuApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');
        }

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.VOLCENGINE) {
            new Setting(this.containerEl)
                .setName('App ID')
                .setDesc('VolcEngine App ID')
                .addText(text => text
                    .setPlaceholder('Enter your app ID')
                    .setValue(this.plugin.settings.volcengineAppId)
                    .onChange(async (value) => {
                        this.plugin.settings.volcengineAppId = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(this.containerEl)
                .setName('Access token')
                .setDesc('VolcEngine Access Token')
                .addText(text => text
                    .setPlaceholder('Enter your access token')
                    .setValue(this.plugin.settings.volcengineAccessToken)
                    .onChange(async (value) => {
                        this.plugin.settings.volcengineAccessToken = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');
        }

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.LOCAL_WHISPER) {
            new Setting(this.containerEl)
                .setName('Server URL')
                .setDesc('URL of your local Whisper server (e.g., http://localhost:9000)')
                .addText(text => text
                    .setPlaceholder('http://localhost:9000')
                    .setValue(this.plugin.settings.whisperServerUrl)
                    .onChange(async (value) => {
                        this.plugin.settings.whisperServerUrl = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(this.containerEl)
                .setName('Model')
                .setDesc('Whisper model to use (tiny, base, small, medium, large, large-v3)')
                .addDropdown(dropdown => dropdown
                    .addOption('tiny', 'tiny (fastest, least accurate)')
                    .addOption('base', 'base')
                    .addOption('small', 'small')
                    .addOption('medium', 'medium')
                    .addOption('large', 'large')
                    .addOption('large-v3', 'large-v3 (most accurate)')
                    .setValue(this.plugin.settings.whisperModel || 'base')
                    .onChange(async (value) => {
                        this.plugin.settings.whisperModel = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(this.containerEl)
                .setName('Language')
                .setDesc('Language for transcription (auto = auto-detect)')
                .addDropdown(dropdown => dropdown
                    .addOption('auto', 'Auto-detect')
                    .addOption('en', 'English')
                    .addOption('zh', 'Chinese')
                    .addOption('ja', 'Japanese')
                    .addOption('ko', 'Korean')
                    .addOption('de', 'German')
                    .addOption('fr', 'French')
                    .addOption('es', 'Spanish')
                    .addOption('ru', 'Russian')
                    .setValue(this.plugin.settings.whisperLanguage || 'auto')
                    .onChange(async (value) => {
                        this.plugin.settings.whisperLanguage = value;
                        await this.plugin.saveSettings();
                    }));

            // Setup instructions
            const infoEl = this.containerEl.createEl('div', { cls: 'setting-item-description' });
            infoEl.innerHTML = `
                <details style="margin-top: 10px; padding: 10px; background: var(--background-secondary); border-radius: 5px;">
                    <summary style="cursor: pointer; font-weight: bold;">How to set up a local Whisper server</summary>
                    <div style="margin-top: 10px;">
                        <p><strong>Option 1: faster-whisper-server (Recommended)</strong></p>
                        <pre style="background: var(--background-primary); padding: 8px; border-radius: 4px; overflow-x: auto;">pip install faster-whisper-server
faster-whisper-server --host 0.0.0.0 --port 9000</pre>
                        
                        <p style="margin-top: 10px;"><strong>Option 2: Docker</strong></p>
                        <pre style="background: var(--background-primary); padding: 8px; border-radius: 4px; overflow-x: auto;">docker run -d -p 9000:8000 \\
  fedirz/faster-whisper-server:latest-cpu</pre>
                        
                        <p style="margin-top: 10px;">For GPU support, use <code>:latest-cuda</code> tag.</p>
                    </div>
                </details>
            `;
        }

        new Setting(this.containerEl)
            .setName('Context prompt')
            .setDesc('Provide context to improve transcription accuracy')
            .addTextArea(text => text
                .setPlaceholder('E.g., this is a technical meeting about...')
                .setValue(this.plugin.settings.contextPrompt)
                .onChange(async (value) => {
                    this.plugin.settings.contextPrompt = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('Hotwords')
            .setDesc('Comma-separated list of words to prioritize (e.g., specialized terms)')
            .addText(text => text
                .setPlaceholder('Word1, word2')
                .setValue(this.plugin.settings.hotwords.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.hotwords = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    await this.plugin.saveSettings();
                }));
    }
}
