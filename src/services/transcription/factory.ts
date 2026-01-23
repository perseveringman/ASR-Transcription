import { TranscriptionService, TranscriptionOptions } from '../../types/transcription';
import { ZhipuTranscriptionService } from './zhipu-api';
import { VolcengineTranscriptionService } from './volcengine-api';
import { PluginSettings, TranscriptionProvider } from '../../types/config';

export class TranscriptionServiceFactory {
    static create(settings: PluginSettings): TranscriptionService {
        switch (settings.transcriptionProvider) {
            case TranscriptionProvider.VOLCENGINE:
                return new VolcengineTranscriptionService(settings);
            case TranscriptionProvider.ZHIPU:
            default:
                return new ZhipuTranscriptionService(settings);
        }
    }
}
