import { Notice, TFile, Platform } from 'obsidian';
import { PluginSettings } from '../types/config';
import { TranscriptionService } from '../types/transcription';
import { TranscriptionServiceFactory } from '../services/transcription/factory';
import { AudioConverter } from '../services/audio-converter';

export class TranscriptionManager {
    private service: TranscriptionService;

    constructor(private settings: PluginSettings) {
        this.service = TranscriptionServiceFactory.create(settings);
    }

    public updateSettings(settings: PluginSettings) {
        this.settings = settings;
        this.service = TranscriptionServiceFactory.create(settings);
    }

    /**
     * Main entry point for transcribing audio.
     * Handles file reading, format conversion, constraint checking, and chunking.
     */
    async transcribe(audio: Blob | TFile, app: any): Promise<string> {
        const constraints = this.service.getConstraints();
        const notice = new Notice(`准备转写中...`, 0);

        try {
            let arrayBuffer: ArrayBuffer;
            let blob: Blob;
            let extension = '';

            if (audio instanceof TFile) {
                arrayBuffer = await app.vault.readBinary(audio);
                extension = audio.extension.toLowerCase();
                blob = new Blob([arrayBuffer], { type: this.getMimeType(audio) });
            } else {
                arrayBuffer = await audio.arrayBuffer();
                blob = audio;
                if (audio instanceof File) {
                    extension = audio.name.split('.').pop()?.toLowerCase() || '';
                } else {
                    extension = blob.type.includes('wav') ? 'wav' : (blob.type.includes('mp4') || blob.type.includes('m4a') ? 'm4a' : 'mp3');
                }
            }
            
            let fullText = '';

            // On mobile, skip AudioContext decoding to avoid memory crashes.
            // Send the original audio directly — ASR services (Zhipu, Volcengine) support m4a/mp3 natively.
            if (Platform.isMobile) {
                // Only chunk by file size on mobile (no duration check without AudioContext)
                if (blob.size > constraints.maxFileSizeBytes) {
                    throw new Error(`Audio file too large (${(blob.size / 1024 / 1024).toFixed(1)}MB). Max: ${(constraints.maxFileSizeBytes / 1024 / 1024).toFixed(0)}MB`);
                }

                notice.setMessage(`转写中...`);
                const result = await this.service.transcribe(blob);
                fullText = result.text;
            } else {
                // Desktop: full AudioContext-based processing with chunking support
                const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                const audioContext = new AudioContextClass();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0)); 
                const duration = audioBuffer.duration;
                await audioContext.close();

                // Chunk if duration or size exceeds limits
                const needsChunking = duration > constraints.maxDurationSeconds || blob.size > constraints.maxFileSizeBytes;

                if (needsChunking) {
                    notice.setMessage(`正在分割音频...`);
                    const chunkDuration = Math.min(constraints.maxDurationSeconds, 30); 
                    const chunks = await AudioConverter.splitAndConvert(blob, chunkDuration);
                    
                    for (let i = 0; i < chunks.length; i++) {
                        notice.setMessage(`转写中：第 ${i + 1}/${chunks.length} 段...`);
                        const result = await this.service.transcribe(chunks[i]);
                        fullText += (fullText ? ' ' : '') + result.text.trim();
                    }
                } else {
                    let audioToUpload = blob;
                    
                    if (extension === 'm4a') {
                        notice.setMessage(`正在转换格式...`);
                        audioToUpload = await AudioConverter.convertToWav(blob);
                    }

                    const result = await this.service.transcribe(audioToUpload);
                    fullText = result.text;
                }
            }

            notice.hide();
            return fullText;
        } catch (err: unknown) {
            notice.hide();
            throw err;
        }
    }

    private getMimeType(file: TFile): string {
        switch (file.extension.toLowerCase()) {
            case 'mp3': return 'audio/mpeg';
            case 'wav': return 'audio/wav';
            case 'm4a': return 'audio/mp4';
            case 'ogg': return 'audio/ogg';
            case 'webm': return 'audio/webm';
            default: return 'application/octet-stream';
        }
    }
}
