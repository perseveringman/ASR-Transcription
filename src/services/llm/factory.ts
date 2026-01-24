import { PluginSettings, LLMProvider } from '../../types/config';
import { LLMService } from '../../types/llm';
import { OpenRouterLLMService } from './openrouter-api';
import { OpenAICompatibleLLMService } from './openai-compatible-api';
import { GeminiLLMService } from './gemini-api';
import { AnthropicLLMService } from './anthropic-api';
import { MinimaxLLMService } from './minimax-api';

export class LLMServiceFactory {
    static create(settings: PluginSettings): LLMService {
        switch (settings.llmProvider) {
            case LLMProvider.OPENROUTER:
                return new OpenRouterLLMService(settings);
            
            case LLMProvider.GEMINI:
                return new GeminiLLMService(settings);

            case LLMProvider.ANTHROPIC:
                return new AnthropicLLMService(settings);

            case LLMProvider.OPENAI:
                return new OpenAICompatibleLLMService('OpenAI', {
                    apiKey: settings.openAIApiKey,
                    baseUrl: settings.openAIBaseUrl || 'https://api.openai.com/v1',
                    model: settings.openAIModel || 'gpt-4o-mini'
                });

            case LLMProvider.DEEPSEEK:
                return new OpenAICompatibleLLMService('DeepSeek', {
                    apiKey: settings.deepseekApiKey,
                    baseUrl: 'https://api.deepseek.com',
                    model: settings.deepseekModel || 'deepseek-chat'
                });

            case LLMProvider.ZHIPU:
                return new OpenAICompatibleLLMService('Zhipu AI', {
                    apiKey: settings.zhipuLLMApiKey,
                    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
                    model: settings.zhipuLLMModel || 'glm-4-flash'
                });

            case LLMProvider.MINIMAX:
                return new MinimaxLLMService(settings);

            default:
                throw new Error(`Unsupported LLM provider: ${settings.llmProvider}`);
        }
    }
}