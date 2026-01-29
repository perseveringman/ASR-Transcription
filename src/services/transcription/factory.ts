import { TranscriptionService } from '../../types/transcription';
import { ZhipuTranscriptionService } from './zhipu-api';
import { VolcengineTranscriptionService } from './volcengine-api';
import { LocalWhisperTranscriptionService } from './local-whisper-api';
import { PluginSettings, TranscriptionProvider } from '../../types/config';

export class TranscriptionServiceFactory {
    static create(settings: PluginSettings): TranscriptionService {
        switch (settings.transcriptionProvider) {
            case TranscriptionProvider.VOLCENGINE:
                return new VolcengineTranscriptionService(settings);
            case TranscriptionProvider.LOCAL_WHISPER:
                return new LocalWhisperTranscriptionService(settings);
            case TranscriptionProvider.ZHIPU:
            default:
                return new ZhipuTranscriptionService(settings);
        }
    }
}
