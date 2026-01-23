import { App, Editor, MarkdownView, TFile, moment } from 'obsidian';
import { PluginSettings, InsertPosition } from '../types/config';

export class TextInserter {
    constructor(private app: App, private settings: PluginSettings) {}

    async insert(text: string, targetFile?: TFile) {
        const formattedText = this.formatText(text, targetFile);

        if (targetFile) {
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
                this.insertAtCursor(formattedText);
                break;
            case InsertPosition.DOCUMENT_END:
                this.insertAtEnd(formattedText);
                break;
            case InsertPosition.NEW_NOTE:
                await this.createNewNote(formattedText);
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

    private insertAtCursor(text: string) {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            const cursor = editor.getCursor();
            editor.replaceRange(text, cursor);
        } else {
            // If no active markdown view, maybe create a new note or show notice
            this.createNewNote(text);
        }
    }

    private insertAtEnd(text: string) {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            const lineCount = editor.lineCount();
            editor.replaceRange(`\n${text}`, { line: lineCount, ch: 0 });
        } else {
            this.createNewNote(text);
        }
    }

    private async createNewNote(text: string) {
        const folder = this.settings.newNoteFolder || '/';
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

        const file = await this.app.vault.create(path, text);
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(file);
    }
}
