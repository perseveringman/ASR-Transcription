import { App, TFile, TAbstractFile, Notice, moment, EventRef } from 'obsidian';
import { PluginSettings } from '../types/config';
import { TranscriptionManager } from './transcription-manager';
import { LLMManager } from './llm-manager';
import { TranscriptionNoteService } from '../services/transcription-note-service';

const AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac'];
const FILE_SETTLE_DELAY_MS = 3000; // Wait for file sync to complete

/** Normalize folder path: strip leading '/' since Obsidian vault paths never start with '/' */
function normalizeFolderPath(folder: string): string {
    return folder.replace(/^\/+/, '') || '/';
}

/**
 * Manages automatic transcription of audio files.
 * - On startup: scans audioSaveFolder for unprocessed audio files
 * - At runtime: listens for new audio files via vault.on('create')
 */
export class AutoTranscriptionManager {
    private processing: Set<string> = new Set();
    private eventRef: EventRef | null = null;

    constructor(
        private app: App,
        private settings: PluginSettings,
        private transcriptionManager: TranscriptionManager,
        private llmManager: LLMManager,
        private noteService: TranscriptionNoteService
    ) {}

    /**
     * Start auto transcription: initial scan + event listener.
     * Should be called during plugin onload.
     */
    public start(): void {
        if (!this.settings.enableAutoTranscription) {
            return;
        }

        // Initial scan for unprocessed audio files
        // Use setTimeout to avoid blocking plugin startup
        new Notice('自动转写已启动，正在监听新录音...');
        setTimeout(() => {
            void this.scanAndProcessPending();
        }, 5000); // 5s delay to let vault fully index

        // Register event listener for new files
        this.eventRef = this.app.vault.on('create', (file: TAbstractFile) => {
            this.onFileCreated(file);
        });
    }

    /**
     * Stop auto transcription: unregister event listener.
     * Should be called during plugin onunload.
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
        const wasEnabled = this.settings.enableAutoTranscription;
        this.settings = settings;
        const isEnabled = this.settings.enableAutoTranscription;

        if (!wasEnabled && isEnabled) {
            this.start();
        } else if (wasEnabled && !isEnabled) {
            this.stop();
        }
    }

    /**
     * Scan audioSaveFolder for audio files that don't have corresponding transcription notes.
     */
    private async scanAndProcessPending(): Promise<void> {
        if (!this.settings.enableAutoTranscription) {
            return;
        }

        const audioFolder = normalizeFolderPath(this.settings.audioSaveFolder || '/');
        const allFiles = this.app.vault.getFiles();
        
        const audioFiles = allFiles.filter(file => {
            const isAudio = AUDIO_EXTENSIONS.includes(file.extension.toLowerCase());
            const inFolder = audioFolder === '/'
                ? true
                : file.path.startsWith(audioFolder + '/') || file.path === audioFolder;
            return isAudio && inFolder;
        });

        console.log(`[ASR Auto] 扫描目录: "${audioFolder}", 找到 ${audioFiles.length} 个音频文件`);

        const unprocessed: TFile[] = [];
        for (const file of audioFiles) {
            const isUnprocessed = await this.isUnprocessedAudio(file);
            const ts = this.getTimestampForFilename(file);
            console.log(`[ASR Auto] ${file.name} → timestamp=${ts}, unprocessed=${isUnprocessed}`);
            if (isUnprocessed) {
                unprocessed.push(file);
            }
        }

        console.log(`[ASR Auto] 未处理音频: ${unprocessed.length} 个`);

        if (unprocessed.length === 0) {
            return;
        }

        const notice = new Notice(`发现 ${unprocessed.length} 个未转写的录音，正在自动处理...`, 0);

        let completed = 0;
        for (const file of unprocessed) {
            try {
                await this.processAudioFile(file);
                completed++;
                notice.setMessage(`自动转写进度: ${completed}/${unprocessed.length}...`);
            } catch (error) {
                console.error(`[ASR Auto] 自动转写失败: ${file.name}`, error);
            }
        }

        notice.hide();

        if (completed > 0) {
            new Notice(`自动转写完成: ${completed}/${unprocessed.length} 个录音已处理`);
        }
    }

    /**
     * Handle vault file creation event.
     */
    private onFileCreated(file: TAbstractFile): void {
        if (!this.settings.enableAutoTranscription) {
            return;
        }

        if (!(file instanceof TFile)) {
            return;
        }

        if (!AUDIO_EXTENSIONS.includes(file.extension.toLowerCase())) {
            return;
        }

        // Check if file is in the audioSaveFolder
        const audioFolder = normalizeFolderPath(this.settings.audioSaveFolder || '/');
        if (audioFolder !== '/') {
            if (!file.path.startsWith(audioFolder + '/')) {
                return;
            }
        }

        // Delay processing to allow file sync to complete
        setTimeout(() => {
            void this.handleNewAudioFile(file);
        }, FILE_SETTLE_DELAY_MS);
    }

    /**
     * Process a newly detected audio file.
     */
    private async handleNewAudioFile(file: TFile): Promise<void> {
        // Re-check the file still exists (might have been deleted/moved)
        const currentFile = this.app.vault.getAbstractFileByPath(file.path);
        if (!(currentFile instanceof TFile)) {
            return;
        }

        if (!(await this.isUnprocessedAudio(currentFile))) {
            return;
        }

        try {
            new Notice(`正在自动转写: ${currentFile.name}...`);
            await this.processAudioFile(currentFile);
            new Notice(`自动转写完成: ${currentFile.name}`);
        } catch (error) {
            console.error(`[ASR Auto] 自动转写失败: ${currentFile.name}`, error);
            new Notice(`自动转写失败: ${currentFile.name}`);
        }
    }

    /**
     * Check if an audio file has already been transcribed.
     * Looks for a matching transcription note in voiceNoteFolder.
     */
    private async isUnprocessedAudio(file: TFile): Promise<boolean> {
        if (this.processing.has(file.path)) {
            return false;
        }

        const voiceNoteFolder = normalizeFolderPath(this.settings.voiceNoteFolder || '/');
        const timestamp = this.getTimestampForFilename(file);
        const expectedNoteName = `Transcription-${timestamp}.md`;
        const expectedPath = voiceNoteFolder === '/'
            ? expectedNoteName
            : `${voiceNoteFolder}/${expectedNoteName}`;

        return !(await this.app.vault.adapter.exists(expectedPath));
    }

    /**
     * Process a single audio file: transcribe → polish → create note.
     * Linking to daily note is handled independently by AutoLinkManager.
     */
    private async processAudioFile(file: TFile): Promise<void> {
        if (this.processing.has(file.path)) {
            return;
        }

        this.processing.add(file.path);

        try {
            // 1. Transcribe
            const fullText = await this.transcriptionManager.transcribe(file, this.app);

            // 2. AI Polish (optional, non-blocking)
            let aiText = '';
            if (this.settings.enableAiPolishing) {
                try {
                    aiText = await this.llmManager.polish(fullText);
                } catch (e) {
                    console.error(`[ASR Auto] AI Polishing failed for ${file.name}:`, e);
                }
            }

            // 3. Create transcription note
            await this.noteService.createTranscriptionNote(fullText, file, aiText);
        } finally {
            this.processing.delete(file.path);
        }
    }

    /**
     * Get timestamp string for matching transcription note filenames.
     * Matches the logic in TranscriptionNoteService.getTimestampForFilename.
     *
     * Priority: filename timestamp > mtime > ctime > now
     * File ctime is unreliable after sync/copy operations (all files get the same ctime).
     */
    private getTimestampForFilename(audioFile: TFile): string {
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

        return moment().format('YYYYMMDD-HHmmss');
    }

    /**
     * Extract YYYYMMDD-HHmmss timestamp from a filename like "20260123-203038".
     * Returns null if the filename doesn't match the expected pattern.
     */
    private extractTimestampFromFilename(basename: string): string | null {
        const match = basename.match(/^(\d{8}-\d{6})/);
        if (match) {
            // Validate it's a real date
            const parsed = moment(match[1], 'YYYYMMDD-HHmmss', true);
            if (parsed.isValid()) {
                return match[1];
            }
        }
        return null;
    }
}
