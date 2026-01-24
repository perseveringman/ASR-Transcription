import { PluginSettings, LLMProvider } from '../../types/config';
import { LLMService } from '../../types/llm';
import { OpenRouterLLMService } from './openrouter-api';

export class LLMServiceFactory {
    static create(settings: PluginSettings): LLMService {
        switch (settings.llmProvider) {
            case LLMProvider.OPENROUTER:
                return new OpenRouterLLMService(settings);
            default:
                throw new Error(`Unsupported LLM provider: ${settings.llmProvider}`);
        }
    }
}
