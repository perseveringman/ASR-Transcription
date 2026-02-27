import { App, TFile, moment } from 'obsidian';
import { PluginSettings } from '../types/config';
import { TranscriptionResult, TranscriptionUtterance } from '../types/transcription';

export class TranscriptionNoteService {
    constructor(private app: App, private settings: PluginSettings) {}

    public updateSettings(settings: PluginSettings) {
        this.settings = settings;
    }

    /**
     * Create a new note with transcription content
     * @param result - Full transcription result with optional utterances
     * @param audioFile - The audio file being transcribed
     * @param aiText - Optional AI polished text
     */
    public async createTranscriptionNote(
        result: TranscriptionResult | string,
        audioFile: TFile,
        aiText?: string
    ): Promise<TFile> {
        // Support both string and TranscriptionResult for backward compatibility
        const text = typeof result === 'string' ? result : result.text;
        const utterances = typeof result === 'string' ? undefined : result.utterances;
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
                content = this.applyTemplate(templateContent, text, audioFile, aiText, utterances);
            } else {
                // Template not found, fallback to formatted text
                console.warn(`[ASR Plugin] Template file not found at path: ${templatePath}`);
                content = this.formatTranscriptionText(text, audioFile, aiText, utterances);
            }
        } else {
            content = this.formatTranscriptionText(text, audioFile, aiText, utterances);
        }

        const path = await this.ensureUniquePath(initialPath);
        return await this.app.vault.create(path, content);
    }

    /**
     * Get timestamp for note filename from audio file.
     *
     * Priority: filename timestamp > mtime > ctime > now
     * File ctime is unreliable after sync/copy operations.
     */
    private getTimestampForFilename(audioFile?: TFile): string {
        if (audioFile) {
            // 1. Try to extract timestamp from filename (e.g. "20260123-203038.m4a")
            const filenameTimestamp = this.extractTimestampFromFilename(audioFile.basename);
            if (filenameTimestamp) {
                return filenameTimestamp;
            }

            // 2. Fallback to mtime (content modification time, more reliable than ctime)
            const mtime = audioFile.stat?.mtime;
            if (typeof mtime === 'number' && Number.isFinite(mtime)) {
                return moment(mtime).format('YYYYMMDD-HHmmss');
            }

            // 3. Fallback to ctime
            const ctime = audioFile.stat?.ctime;
            if (typeof ctime === 'number' && Number.isFinite(ctime)) {
                return moment(ctime).format('YYYYMMDD-HHmmss');
            }
        }

        return moment().format('YYYYMMDD-HHmmss');
    }

    /**
     * Extract YYYYMMDD-HHmmss timestamp from a filename like "20260123-203038".
     * Returns null if the filename doesn't match the expected pattern.
     */
    private extractTimestampFromFilename(basename: string): string | null {
        const match = basename.match(/^(\d{8}-\d{6})/);
        if (match) {
            const parsed = moment(match[1], 'YYYYMMDD-HHmmss', true);
            if (parsed.isValid()) {
                return match[1];
            }
        }
        return null;
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

    /**
     * Format milliseconds to MM:SS or HH:MM:SS format
     */
    private formatTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Format utterances with timestamps and speaker labels
     */
    private formatUtterances(utterances: TranscriptionUtterance[]): string {
        const lines: string[] = [];
        
        for (const u of utterances) {
            const timeStr = `[${this.formatTime(u.startTime)}]`;
            const speakerStr = u.speakerId !== undefined ? `**Speaker ${u.speakerId + 1}**: ` : '';
            lines.push(`${timeStr} ${speakerStr}${u.text}`);
        }
        
        return lines.join('\n\n');
    }

    /**
     * Format transcription text with audio link and optional timestamp/separator
     */
    private formatTranscriptionText(
        text: string,
        audioFile?: TFile,
        aiText?: string,
        utterances?: TranscriptionUtterance[]
    ): string {
        let result: string;

        // Use formatted utterances if available, otherwise use plain text
        if (utterances && utterances.length > 0) {
            result = this.formatUtterances(utterances);
        } else {
            result = text.trim();
            if (this.settings.addTimestamp) {
                const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
                result = `[${timestamp}] ${result}`;
            }
        }
        
        if (aiText) {
            result += `\n\n> [!AI] AI Polish\n> ${aiText.trim()}`;
        }

        if (audioFile) {
            result = `![[${audioFile.path}]]\n\n${result}`;
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
    private applyTemplate(
        template: string,
        transcription: string,
        audioFile?: TFile,
        aiText?: string,
        utterances?: TranscriptionUtterance[]
    ): string {
        const now = moment();
        
        // Format utterances if available
        const formattedUtterances = utterances && utterances.length > 0
            ? this.formatUtterances(utterances)
            : transcription;
        
        const vars: Record<string, string> = {
            '{{date}}': now.format('YYYY-MM-DD'),
            '{{time}}': now.format('HH:mm:ss'),
            '{{datetime}}': now.format('YYYY-MM-DD HH:mm:ss'),
            '{{transcription}}': transcription,
            '{{content}}': transcription,
            '{{text}}': transcription,
            '{{utterances}}': formattedUtterances,
            '{{transcript_with_timestamps}}': formattedUtterances,
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
