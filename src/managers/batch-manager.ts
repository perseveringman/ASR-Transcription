import { App, TFile, Notice, moment } from 'obsidian';
import { TaskQueue } from '../utils/task-queue';
import { TranscriptionManager } from './transcription-manager';
import { LLMManager } from './llm-manager';
import { PluginSettings } from '../types/config';
import { TranscriptionNoteService } from '../services/transcription-note-service';

export class BatchManager {
    constructor(
        private app: App,
        private settings: PluginSettings,
        private transcriptionManager: TranscriptionManager,
        private llmManager: LLMManager,
        private noteService: TranscriptionNoteService
    ) {}

    /**
     * Finds audio files created today
     */
    public getTodaysAudioFiles(): TFile[] {
        const audioExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac'];
        const todayStart = moment().startOf('day').valueOf();
        const todayEnd = moment().endOf('day').valueOf();

        return this.app.vault.getFiles().filter(file => {
            const isAudio = audioExtensions.includes(file.extension.toLowerCase());
            const createdToday = file.stat.ctime >= todayStart && file.stat.ctime <= todayEnd;
            return isAudio && createdToday;
        });
    }

    /**
     * Batch process audio files and link them to the daily note
     */
    public async processTodaysAudioFiles() {
        const audioFiles = this.getTodaysAudioFiles();
        if (audioFiles.length === 0) {
            new Notice('今日没有找到新的录音文件。');
            return;
        }

        const notice = new Notice(`准备处理 ${audioFiles.length} 个录音文件...`, 0);
        
        const queue = new TaskQueue({
            concurrency: 20,
            onProgress: (completed, total) => {
                notice.setMessage(`正在处理语音笔记: ${completed}/${total}...`);
            }
        });

        const results: TFile[] = [];
        const tasks = audioFiles.map(file => async () => {
            try {
                const fullText = await this.transcriptionManager.transcribe(file, this.app);
                let aiText = '';
                try {
                    aiText = await this.llmManager.polish(fullText);
                } catch (e) {
                    console.error(`AI Polishing failed for ${file.name}:`, e);
                }
                const noteFile = await this.noteService.createTranscriptionNote(fullText, file, aiText);
                results.push(noteFile);
            } catch (error) {
                console.error(`处理文件失败: ${file.name}`, error);
                new Notice(`处理失败: ${file.name}`);
            }
        });

        // Add all tasks to queue and wait for completion
        await Promise.all(tasks.map(task => queue.add(task)));

        notice.hide();

        if (results.length > 0) {
            await this.linkNotesToDailyNote(results);
            new Notice(`成功生成 ${results.length} 个语音笔记并已添加到日记中。`);
        } else {
            new Notice('未能生成任何语音笔记。');
        }
    }

    /**
     * Link the generated notes to the daily note
     */
    private async linkNotesToDailyNote(notes: TFile[]) {
        const dailyNote = await this.getOrCreateDailyNote();
        if (!dailyNote) {
            new Notice('无法获取或创建今日日记。');
            return;
        }

        let content = await this.app.vault.read(dailyNote);
        const sectionHeader = '### 语音笔记';
        
        // Filter out notes that are already linked in the daily note
        const newNotes = notes.filter(note => {
            const link = `[[${note.path}|${note.basename}]]`;
            return !content.includes(link);
        });

        if (newNotes.length === 0) {
            return;
        }

        const linksContent = newNotes.map(note => `- [[${note.path}|${note.basename}]]`).join('\n');

        if (content.includes(sectionHeader)) {
            const lines = content.split('\n');
            const headerIndex = lines.findIndex(line => line.trim() === sectionHeader);
            
            // Insert after the header
            lines.splice(headerIndex + 1, 0, linksContent);
            content = lines.join('\n');
        } else {
            // Append the new section to the end of the file
            content = content.trim() + `\n\n${sectionHeader}\n${linksContent}\n`;
        }

        await this.app.vault.modify(dailyNote, content);
    }

    /**
     * Gets today's daily note or creates it if it doesn't exist
     */
    private async getOrCreateDailyNote(): Promise<TFile | null> {
        // Try to use the Daily Notes plugin settings if available
        const dailyNotesPlugin = (this.app as any).internalPlugins?.getPluginById('daily-notes');
        const dailyNotesEnabled = dailyNotesPlugin?.enabled;
        
        let folder = '';
        let format = 'YYYY-MM-DD';

        if (dailyNotesEnabled && dailyNotesPlugin.instance?.options) {
            const options = dailyNotesPlugin.instance.options;
            folder = options.folder || '';
            format = options.format || 'YYYY-MM-DD';
        }

        const fileName = moment().format(format) + '.md';
        const path = folder ? `${folder}/${fileName}` : fileName;

        let file = this.app.vault.getAbstractFileByPath(path);
        
        if (!file) {
            try {
                // Ensure folder exists
                if (folder) {
                    const folderExists = await this.app.vault.adapter.exists(folder);
                    if (!folderExists) {
                        await this.app.vault.createFolder(folder);
                    }
                }
                file = await this.app.vault.create(path, '');
            } catch (error) {
                console.error('创建日记文件失败:', error);
                return null;
            }
        }

        return file instanceof TFile ? file : null;
    }
}
