import { App, TFile, TAbstractFile, Notice, moment, EventRef } from 'obsidian';
import { PluginSettings } from '../types/config';
import { DailyNoteLinkService } from '../services/daily-note-link-service';

const NOTE_SETTLE_DELAY_MS = 2000; // Wait for note content to be fully written

/** Normalize folder path: strip leading '/' since Obsidian vault paths never start with '/' */
function normalizeFolderPath(folder: string): string {
    return folder.replace(/^\/+/, '') || '/';
}

/**
 * Manages automatic linking of transcription notes to daily notes.
 * - On startup: scans voiceNoteFolder for unlinked transcription notes
 * - At runtime: listens for new transcription notes via vault.on('create')
 *
 * Independent from AutoTranscriptionManager — communicates through the file system:
 * AutoTranscriptionManager creates notes → vault 'create' event → AutoLinkManager links them.
 */
export class AutoLinkManager {
    private processing: Set<string> = new Set();
    private eventRef: EventRef | null = null;

    constructor(
        private app: App,
        private settings: PluginSettings,
        private dailyNoteLinkService: DailyNoteLinkService
    ) {}

    /**
     * Start auto linking: initial scan + event listener.
     */
    public start(): void {
        if (!this.settings.enableAutoLink) {
            return;
        }

        new Notice('自动链接已启动，正在监听新转写笔记...');

        // Initial scan for unlinked transcription notes
        setTimeout(() => {
            void this.scanAndLinkPending();
        }, 6000); // 6s delay — slightly after auto-transcription scan (5s)

        // Register event listener for new files
        this.eventRef = this.app.vault.on('create', (file: TAbstractFile) => {
            this.onFileCreated(file);
        });
    }

    /**
     * Stop auto linking: unregister event listener.
     */
    public stop(): void {
        if (this.eventRef) {
            this.app.vault.offref(this.eventRef);
            this.eventRef = null;
        }
    }

    /**
     * Update settings reference. Restarts monitoring if needed.
     */
    public updateSettings(settings: PluginSettings): void {
        const wasEnabled = this.settings.enableAutoLink;
        this.settings = settings;
        const isEnabled = this.settings.enableAutoLink;

        if (!wasEnabled && isEnabled) {
            this.start();
        } else if (wasEnabled && !isEnabled) {
            this.stop();
        }
    }

    /**
     * Scan voiceNoteFolder for transcription notes not yet linked to their daily notes.
     */
    private async scanAndLinkPending(): Promise<void> {
        if (!this.settings.enableAutoLink) {
            return;
        }

        const voiceNoteFolder = normalizeFolderPath(this.settings.voiceNoteFolder || '/');
        const allFiles = this.app.vault.getFiles();

        // Find all Transcription-*.md files in voiceNoteFolder
        const transcriptionNotes = allFiles.filter(file => {
            if (file.extension !== 'md') return false;
            if (!file.basename.startsWith('Transcription-')) return false;
            if (voiceNoteFolder === '/') return true;
            return file.path.startsWith(voiceNoteFolder + '/');
        });

        console.log(`[ASR AutoLink] 扫描目录: "${voiceNoteFolder}", 找到 ${transcriptionNotes.length} 个转写笔记`);

        // Check which notes are not yet linked
        const unlinked: TFile[] = [];
        for (const note of transcriptionNotes) {
            if (await this.isUnlinkedNote(note)) {
                unlinked.push(note);
            }
        }

        console.log(`[ASR AutoLink] 未链接笔记: ${unlinked.length} 个`);

        if (unlinked.length === 0) {
            return;
        }

        const notice = new Notice(`发现 ${unlinked.length} 个未链接的转写笔记，正在链接到每日笔记...`, 0);

        try {
            await this.dailyNoteLinkService.linkNotesToDailyNote(unlinked);
            notice.hide();
            new Notice(`自动链接完成: ${unlinked.length} 个转写笔记已链接到对应日期的每日笔记`);
        } catch (error) {
            notice.hide();
            console.error('[ASR AutoLink] 批量链接失败:', error);
            new Notice('自动链接失败，请查看控制台');
        }
    }

    /**
     * Handle vault file creation event.
     */
    private onFileCreated(file: TAbstractFile): void {
        if (!this.settings.enableAutoLink) {
            return;
        }

        if (!(file instanceof TFile)) {
            return;
        }

        if (!this.isTranscriptionNote(file)) {
            return;
        }

        // Delay to let file content be fully written
        setTimeout(() => {
            void this.handleNewNote(file);
        }, NOTE_SETTLE_DELAY_MS);
    }

    /**
     * Process a newly detected transcription note.
     */
    private async handleNewNote(file: TFile): Promise<void> {
        const currentFile = this.app.vault.getAbstractFileByPath(file.path);
        if (!(currentFile instanceof TFile)) {
            return;
        }

        if (this.processing.has(currentFile.path)) {
            return;
        }

        if (!(await this.isUnlinkedNote(currentFile))) {
            return;
        }

        this.processing.add(currentFile.path);
        try {
            await this.dailyNoteLinkService.linkNotesToDailyNote([currentFile]);
            console.log(`[ASR AutoLink] 已链接: ${currentFile.name}`);
        } catch (error) {
            console.error(`[ASR AutoLink] 链接失败: ${currentFile.name}`, error);
        } finally {
            this.processing.delete(currentFile.path);
        }
    }

    /**
     * Check if a file is a transcription note in the voiceNoteFolder.
     */
    private isTranscriptionNote(file: TFile): boolean {
        if (file.extension !== 'md') return false;
        if (!file.basename.startsWith('Transcription-')) return false;

        const voiceNoteFolder = normalizeFolderPath(this.settings.voiceNoteFolder || '/');
        if (voiceNoteFolder === '/') return true;
        return file.path.startsWith(voiceNoteFolder + '/');
    }

    /**
     * Check if a transcription note is already linked in its corresponding daily note.
     */
    private async isUnlinkedNote(note: TFile): Promise<boolean> {
        // Parse date from filename: Transcription-YYYYMMDD-HHmmss.md
        const match = note.basename.match(/^Transcription-(\d{4})(\d{2})(\d{2})/);
        if (!match) {
            return false; // Can't determine date, skip
        }

        const dateStr = `${match[1]}-${match[2]}-${match[3]}`;
        const noteDate = moment(dateStr, 'YYYY-MM-DD', true);
        if (!noteDate.isValid()) {
            return false;
        }

        // Get the daily note for this date (without creating it)
        const dailyNote = await this.findDailyNote(noteDate);
        if (!dailyNote) {
            // Daily note doesn't exist yet — this note is unlinked
            return true;
        }

        // Check if the link already exists in the daily note
        const content = await this.app.vault.read(dailyNote);
        const link = `[[${note.path}|${note.basename}]]`;
        return !content.includes(link);
    }

    /**
     * Find a daily note for the given date (does not create one).
     */
    private async findDailyNote(date: ReturnType<typeof moment>): Promise<TFile | null> {
        const dailyNotesPlugin = (this.app as any).internalPlugins?.getPluginById('daily-notes');
        const dailyNotesEnabled = dailyNotesPlugin?.enabled;

        let folder = '';
        let format = 'YYYY-MM-DD';

        if (dailyNotesEnabled && dailyNotesPlugin.instance?.options) {
            const options = dailyNotesPlugin.instance.options;
            folder = options.folder || '';
            format = options.format || 'YYYY-MM-DD';
        }

        const fileName = date.format(format) + '.md';
        const path = folder ? `${folder}/${fileName}` : fileName;

        const file = this.app.vault.getAbstractFileByPath(path);
        return file instanceof TFile ? file : null;
    }
}
