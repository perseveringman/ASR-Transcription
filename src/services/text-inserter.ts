import { App, MarkdownView, TFile, moment } from 'obsidian';
import { PluginSettings, InsertPosition } from '../types/config';

export class TextInserter {
    constructor(private app: App, private settings: PluginSettings) {}

    async insert(text: string, targetFile?: TFile, aiPolishedText?: string) {
        const formattedText = this.formatText(text, targetFile, aiPolishedText);

        // Only try to insert near audio link if NOT creating a new note
        if (targetFile && this.settings.insertPosition !== InsertPosition.NEW_NOTE) {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView && activeView.file === this.app.workspace.getActiveFile()) {
                const editor = activeView.editor;
                const content = editor.getValue();
                const lines = content.split('\n');
                
                // Try to find the line with the file reference
                let targetLine = -1;
                const fileBaseName = targetFile.basename;

                // Escape special characters for regex
                const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\\]/g, '\\$&');
                const escapedBaseName = escapeRegex(fileBaseName);

                // Look for [[filename]] or ![[filename]]
                const linkRegex = new RegExp(`!\[\[.*${escapedBaseName}.*\]\]|\[\[.*${escapedBaseName}.*\]\]`);

                for (let i = 0; i < lines.length; i++) {
                    if (linkRegex.test(lines[i])) {
                        targetLine = i;
                        break;
                    }
                }

                if (targetLine !== -1) {
                    editor.replaceRange(`\n${formattedText}`, { line: targetLine + 1, ch: 0 });
                    return;
                }
            }
        }

        switch (this.settings.insertPosition) {
            case InsertPosition.CURSOR:
                this.insertAtCursor(formattedText, text, targetFile, aiPolishedText);
                break;
            case InsertPosition.DOCUMENT_END:
                this.insertAtEnd(formattedText, text, targetFile, aiPolishedText);
                break;
            case InsertPosition.NEW_NOTE:
                await this.createNewNote(text, targetFile, aiPolishedText);
                break;
        }
    }

    private formatText(text: string, audioFile?: TFile, aiPolishedText?: string): string {
        let result = text.trim();

        if (this.settings.addTimestamp) {
            const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
            result = `[${timestamp}] ${result}`;
        }

        if (aiPolishedText) {
            result += `\n\n> [!AI] AI Polish\n> ${aiPolishedText.trim()}`;
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

    private insertAtCursor(formattedText: string, rawText: string, audioFile?: TFile, aiPolishedText?: string) {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            const cursor = editor.getCursor();
            editor.replaceRange(formattedText, cursor);
        } else {
            // If no active markdown view, create a new note
            void this.createNewNote(rawText, audioFile, aiPolishedText);
        }
    }

    private insertAtEnd(formattedText: string, rawText: string, audioFile?: TFile, aiPolishedText?: string) {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            const lineCount = editor.lineCount();
            editor.replaceRange(`\n${formattedText}`, { line: lineCount, ch: 0 });
        } else {
            void this.createNewNote(rawText, audioFile, aiPolishedText);
        }
    }

    private async createNewNote(text: string, audioFile?: TFile, aiPolishedText?: string) {
        const folder = this.settings.voiceNoteFolder || '/';
        const timestamp = this.getTimestampForFilename(audioFile);
        const filename = `Transcription-${timestamp}.md`;
        const initialPath = folder === '/' ? filename : `${folder}/${filename}`;

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
                // Use raw text for template, and pass audioFile for audio link variable
                content = this.applyTemplate(templateContent, text, audioFile, aiPolishedText);
            } else {
                // Template not found, fallback to formatted text
                console.warn(`[ASR Plugin] Template file not found at path: ${templatePath}`);
                content = this.formatText(text, audioFile, aiPolishedText);
            }
        } else {
            // No template configured, use formatted text
            content = this.formatText(text, audioFile, aiPolishedText);
        }
        
        const path = await this.ensureUniquePath(initialPath);
        const file = await this.app.vault.create(path, content);
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(file);
    }

    private getTimestampForFilename(audioFile?: TFile): string {
        const audioCreatedAt = audioFile?.stat?.ctime;
        if (typeof audioCreatedAt === 'number' && Number.isFinite(audioCreatedAt)) {
            return moment(audioCreatedAt).format('YYYYMMDD-HHmmss');
        }
        return moment().format('YYYYMMDD-HHmmss');
    }

    private async ensureUniquePath(initialPath: string): Promise<string> {
        if (!await this.app.vault.adapter.exists(initialPath)) {
            return initialPath;
        }

        const basePath = initialPath.replace(/\.md$/, '');
        let counter = 1;
        let candidatePath = `${basePath}-${counter}.md`;

        while (await this.app.vault.adapter.exists(candidatePath)) {
            counter += 1;
            candidatePath = `${basePath}-${counter}.md`;
        }

        return candidatePath;
    }

    private applyTemplate(template: string, transcription: string, audioFile?: TFile, aiPolishedText?: string): string {
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
            '{{aiText}}': aiPolishedText || ''
        };

        let result = template;
        for (const [key, value] of Object.entries(vars)) {
            // Replace all occurrences
            result = result.split(key).join(value);
        }
        return result;
    }
}
