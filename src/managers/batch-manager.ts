import { App, TFile, Notice, moment } from 'obsidian';
import { TaskQueue } from '../utils/task-queue';
import { TranscriptionManager } from './transcription-manager';
import { LLMManager } from './llm-manager';
import { PluginSettings } from '../types/config';
import { TranscriptionNoteService } from '../services/transcription-note-service';
import { DailyNoteLinkService } from '../services/daily-note-link-service';

export class BatchManager {
    constructor(
        private app: App,
        private settings: PluginSettings,
        private transcriptionManager: TranscriptionManager,
        private llmManager: LLMManager,
        private noteService: TranscriptionNoteService,
        private dailyNoteLinkService: DailyNoteLinkService
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
            await this.dailyNoteLinkService.linkNotesToDailyNote(results);
            new Notice(`成功生成 ${results.length} 个语音笔记并已添加到日记中。`);
        } else {
            new Notice('未能生成任何语音笔记。');
        }
    }
}
