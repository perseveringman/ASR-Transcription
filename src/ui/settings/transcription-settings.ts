import { TranscriptionProvider } from '../../types/config';
import ASRPlugin from '../../main';
import { Setting } from 'obsidian';

export class TranscriptionSettingsTab {
    constructor(private containerEl: HTMLElement, private plugin: ASRPlugin, private refresh: () => void) {}

    display(): void {
        new Setting(this.containerEl)
            .setName('语音转写（ASR）')
            .setHeading();

        new Setting(this.containerEl)
            .setName('转写提供商')
            .setDesc('选择语音转文字提供商')
            .addDropdown(dropdown => dropdown
                .addOption(TranscriptionProvider.ZHIPU, '智谱 AI (glm-asr-2512)')
                .addOption(TranscriptionProvider.VOLCENGINE, '火山引擎 豆包')
                .addOption(TranscriptionProvider.LOCAL_WHISPER, '本地 Whisper（自托管）')
                .setValue(this.plugin.settings.transcriptionProvider)
                .onChange(async (value) => {
                    this.plugin.settings.transcriptionProvider = value as TranscriptionProvider;
                    await this.plugin.saveSettings();
                    this.refresh();
                }));

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.ZHIPU) {
            new Setting(this.containerEl)
                .setName('智谱 API 密钥')
                .setDesc('智谱 AI 的 API 密钥')
                .addText(text => text
                    .setPlaceholder('输入您的 API 密钥')
                    .setValue(this.plugin.settings.zhipuApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.zhipuApiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');
        }

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.VOLCENGINE) {
            new Setting(this.containerEl)
                .setName('应用 ID')
                .setDesc('火山引擎应用 ID')
                .addText(text => text
                    .setPlaceholder('输入您的应用 ID')
                    .setValue(this.plugin.settings.volcengineAppId)
                    .onChange(async (value) => {
                        this.plugin.settings.volcengineAppId = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(this.containerEl)
                .setName('访问令牌')
                .setDesc('火山引擎访问令牌')
                .addText(text => text
                    .setPlaceholder('输入您的访问令牌')
                    .setValue(this.plugin.settings.volcengineAccessToken)
                    .onChange(async (value) => {
                        this.plugin.settings.volcengineAccessToken = value.trim();
                        await this.plugin.saveSettings();
                    })
                    .inputEl.type = 'password');

            // Enhanced features for Volcengine
            new Setting(this.containerEl)
                .setName('说话人区分')
                .setDesc('识别并标注不同说话人（最多 10 人）')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableSpeakerDiarization)
                    .onChange(async (value) => {
                        this.plugin.settings.enableSpeakerDiarization = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(this.containerEl)
                .setName('时间戳')
                .setDesc('为每个语句/段落添加时间戳')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableTimestamps)
                    .onChange(async (value) => {
                        this.plugin.settings.enableTimestamps = value;
                        await this.plugin.saveSettings();
                    }));
        }

        if (this.plugin.settings.transcriptionProvider === TranscriptionProvider.LOCAL_WHISPER) {
            new Setting(this.containerEl)
                .setName('服务器地址')
                .setDesc('本地 Whisper 服务器地址（例如：http://localhost:9000）')
                .addText(text => text
                    .setPlaceholder('http://localhost:9000')
                    .setValue(this.plugin.settings.whisperServerUrl)
                    .onChange(async (value) => {
                        this.plugin.settings.whisperServerUrl = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(this.containerEl)
                .setName('模型')
                .setDesc('Whisper 模型（tiny、base、small、medium、large、large-v3）')
                .addDropdown(dropdown => dropdown
                    .addOption('tiny', 'tiny（最快，精度最低）')
                    .addOption('base', 'base')
                    .addOption('small', 'small')
                    .addOption('medium', 'medium')
                    .addOption('large', 'large')
                    .addOption('large-v3', 'large-v3（精度最高）')
                    .setValue(this.plugin.settings.whisperModel || 'base')
                    .onChange(async (value) => {
                        this.plugin.settings.whisperModel = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(this.containerEl)
                .setName('语言')
                .setDesc('转写语言（auto 表示自动检测）')
                .addDropdown(dropdown => dropdown
                    .addOption('auto', '自动检测')
                    .addOption('en', '英语')
                    .addOption('zh', '中文')
                    .addOption('ja', '日语')
                    .addOption('ko', '韩语')
                    .addOption('de', '德语')
                    .addOption('fr', '法语')
                    .addOption('es', '西班牙语')
                    .addOption('ru', '俄语')
                    .setValue(this.plugin.settings.whisperLanguage || 'auto')
                    .onChange(async (value) => {
                        this.plugin.settings.whisperLanguage = value;
                        await this.plugin.saveSettings();
                    }));

            // Setup instructions
            const infoEl = this.containerEl.createEl('div', { cls: 'setting-item-description' });
            infoEl.innerHTML = `
                <details style="margin-top: 10px; padding: 10px; background: var(--background-secondary); border-radius: 5px;">
                    <summary style="cursor: pointer; font-weight: bold;">如何搭建本地 Whisper 服务器</summary>
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
            .setName('转写提示')
            .setDesc('提供背景信息以提高转写准确性')
            .addTextArea(text => text
                .setPlaceholder('例如：这是一个关于...的技术会议')
                .setValue(this.plugin.settings.contextPrompt)
                .onChange(async (value) => {
                    this.plugin.settings.contextPrompt = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(this.containerEl)
            .setName('热词')
            .setDesc('逗号分隔的优先识别词列表（例如专业术语）')
            .addText(text => text
                .setPlaceholder('词1, 词2')
                .setValue(this.plugin.settings.hotwords.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.hotwords = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    await this.plugin.saveSettings();
                }));
    }
}
