import { App, TFile, moment } from 'obsidian';
import { PluginSettings } from '../types/config';

export class TranscriptionNoteService {
    constructor(private app: App, private settings: PluginSettings) {}

    public updateSettings(settings: PluginSettings) {
        this.settings = settings;
    }

    /**
     * Create a new note with transcription content
     */
    public async createTranscriptionNote(text: string, audioFile: TFile, aiText?: string): Promise<TFile> {
        const folder = this.settings.voiceNoteFolder || '/';
        const timestamp = moment().format('YYYYMMDD-HHmmss');
        const filename = `Transcription-${timestamp}.md`;
        const path = folder === '/' ? filename : `${folder}/${filename}`;

        // Ensure folder exists
        if (folder !== '/') {
            const folderExists = await this.app.vault.adapter.exists(folder);
            if (!folderExists) {
                await this.app.vault.createFolder(folder);
            }
        }

        let content: string;
        let templatePath = this.settings.templatePath?.trim();
        
        if (templatePath) {
            // Auto-add .md extension if missing
            if (!templatePath.endsWith('.md')) {
                templatePath = templatePath + '.md';
            }
            
            const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
            
            if (templateFile instanceof TFile) {
                const templateContent = await this.app.vault.read(templateFile);
                content = this.applyTemplate(templateContent, text, audioFile, aiText);
            } else {
                // Template not found, fallback to formatted text
                console.warn(`[ASR Plugin] Template file not found at path: ${templatePath}`);
                content = this.formatTranscriptionText(text, audioFile, aiText);
            }
        } else {
            content = this.formatTranscriptionText(text, audioFile, aiText);
        }

        return await this.app.vault.create(path, content);
    }

    /**
     * Format transcription text with audio link and optional timestamp/separator
     */
    private formatTranscriptionText(text: string, audioFile?: TFile, aiText?: string): string {
        let result = text.trim();

        if (this.settings.addTimestamp) {
            const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
            result = `[${timestamp}] ${result}`;
        }
        
        if (aiText) {
            result += `\n\n> [!AI] AI Polish\n> ${aiText.trim()}`;
        }

        if (audioFile) {
            result = `![[${audioFile.path}]]\n${result}`;
        }

        if (this.settings.addSeparator) {
            result = `---\n${result}\n`;
        } else {
            result = `${result}\n`;
        }

        return result;
    }

    /**
     * Apply template variables to template content
     */
    private applyTemplate(template: string, transcription: string, audioFile?: TFile, aiText?: string): string {
        const now = moment();
        const vars: Record<string, string> = {
            '{{date}}': now.format('YYYY-MM-DD'),
            '{{time}}': now.format('HH:mm:ss'),
            '{{datetime}}': now.format('YYYY-MM-DD HH:mm:ss'),
            '{{transcription}}': transcription,
            '{{content}}': transcription,
            '{{text}}': transcription,
            '{{audio}}': audioFile ? `![[${audioFile.path}]]` : '',
            '{{audio_link}}': audioFile ? `![[${audioFile.path}]]` : '',
            '{{aiText}}': aiText || ''
        };

        let result = template;
        for (const [key, value] of Object.entries(vars)) {
            // Replace all occurrences
            result = result.split(key).join(value);
        }
        return result;
    }
}
