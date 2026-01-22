import { TranscriptionService, TranscriptionOptions } from '../../types/transcription';
import { ZhipuTranscriptionService } from './zhipu-api';
import { PluginSettings } from '../../types/config';

export class TranscriptionServiceFactory {
    static create(settings: PluginSettings): TranscriptionService {
        // For now, only Zhipu is supported
        return new ZhipuTranscriptionService(settings);
    }
}
