import { App, Editor, MarkdownView, TFile, moment } from 'obsidian';
import { PluginSettings, InsertPosition } from '../types/config';

export class TextInserter {
    constructor(private app: App, private settings: PluginSettings) {}

    async insert(text: string, targetFile?: TFile) {
        const formattedText = this.formatText(text, targetFile);

        // Only try to insert near audio link if NOT creating a new note
        if (targetFile && this.settings.insertPosition !== InsertPosition.NEW_NOTE) {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView && activeView.file === this.app.workspace.getActiveFile()) {
                const editor = activeView.editor;
                const content = editor.getValue();
                const lines = content.split('\n');
                
                // Try to find the line with the file reference
                let targetLine = -1;
                const fileName = targetFile.name;
                const fileBaseName = targetFile.basename;

                // Escape special characters for regex
                const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const escapedName = escapeRegex(fileName);
                const escapedBaseName = escapeRegex(fileBaseName);

                // Look for [[filename]] or ![[filename]]
                const linkRegex = new RegExp(`!\\[\\[.*${escapedBaseName}.*\\]\\]|\\[\\[.*${escapedBaseName}.*\\]\\]`);

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
                this.insertAtCursor(formattedText, text, targetFile);
                break;
            case InsertPosition.DOCUMENT_END:
                this.insertAtEnd(formattedText, text, targetFile);
                break;
            case InsertPosition.NEW_NOTE:
                await this.createNewNote(text, targetFile);
                break;
        }
    }

    private formatText(text: string, audioFile?: TFile): string {
        let result = text.trim();

        if (this.settings.addTimestamp) {
            const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
            result = `[${timestamp}] ${result}`;
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

    private insertAtCursor(formattedText: string, rawText: string, audioFile?: TFile) {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            const cursor = editor.getCursor();
            editor.replaceRange(formattedText, cursor);
        } else {
            // If no active markdown view, create a new note with raw text
            this.createNewNote(rawText, audioFile);
        }
    }

    private insertAtEnd(formattedText: string, rawText: string, audioFile?: TFile) {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            const lineCount = editor.lineCount();
            editor.replaceRange(`\n${formattedText}`, { line: lineCount, ch: 0 });
        } else {
            this.createNewNote(rawText, audioFile);
        }
    }

    private async createNewNote(text: string, audioFile?: TFile) {
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
        
        console.log('[ASR Plugin] createNewNote called');
        console.log('[ASR Plugin] templatePath setting:', JSON.stringify(templatePath));
        
        if (templatePath) {
            // Auto-add .md extension if missing
            if (!templatePath.endsWith('.md')) {
                templatePath = templatePath + '.md';
                console.log('[ASR Plugin] Added .md extension, new path:', templatePath);
            }
            
            console.log('[ASR Plugin] Looking for template file at:', templatePath);
            const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
            console.log('[ASR Plugin] templateFile found:', templateFile ? 'yes' : 'no');
            
            if (templateFile instanceof TFile) {
                const templateContent = await this.app.vault.read(templateFile);
                console.log('[ASR Plugin] Template content:', templateContent);
                // Use raw text for template, and pass audioFile for audio link variable
                content = this.applyTemplate(templateContent, text, audioFile);
                console.log('[ASR Plugin] Content after applying template:', content);
            } else {
                // Template not found, fallback to formatted text
                console.warn(`[ASR Plugin] Template file not found at path: ${templatePath}`);
                content = this.formatText(text, audioFile);
            }
        } else {
            // No template configured, use formatted text
            console.log('[ASR Plugin] No template configured, using formatText');
            content = this.formatText(text, audioFile);
        }
        
        console.log('[ASR Plugin] Final content to write:', content);

        const file = await this.app.vault.create(path, content);
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(file);
    }

    private applyTemplate(template: string, transcription: string, audioFile?: TFile): string {
        const now = moment();
        const vars: Record<string, string> = {
            '{{date}}': now.format('YYYY-MM-DD'),
            '{{time}}': now.format('HH:mm:ss'),
            '{{datetime}}': now.format('YYYY-MM-DD HH:mm:ss'),
            '{{transcription}}': transcription,
            '{{content}}': transcription,
            '{{text}}': transcription,
            '{{audio}}': audioFile ? `![[${audioFile.path}]]` : '',
            '{{audio_link}}': audioFile ? `![[${audioFile.path}]]` : ''
        };

        let result = template;
        for (const [key, value] of Object.entries(vars)) {
            result = result.replace(new RegExp(key, 'g'), value);
        }
        return result;
    }
}
