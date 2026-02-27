import { LLMProvider, PluginSettings, TranscriptionProvider } from '../../types/config';

export type SettingsViewMode = 'wizard' | 'tabs';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

function hasText(value: string | undefined | null): boolean {
    return !!value && value.trim().length > 0;
}

export function hasAnyCredential(settings: PluginSettings): boolean {
    const credentials = [
        settings.zhipuApiKey,
        settings.volcengineAppId,
        settings.volcengineAccessToken,
        settings.openRouterApiKey,
        settings.geminiApiKey,
        settings.openAIApiKey,
        settings.anthropicApiKey,
        settings.zhipuLLMApiKey,
        settings.minimaxApiKey,
        settings.deepseekApiKey,
        settings.jinaApiKey,
    ];

    return credentials.some(hasText);
}

export function hasConfiguredSetup(settings: PluginSettings): boolean {
    if (hasAnyCredential(settings)) {
        return true;
    }

    if (settings.transcriptionProvider === TranscriptionProvider.LOCAL_WHISPER) {
        return hasText(settings.whisperServerUrl);
    }

    return false;
}

export function getInitialSettingsMode(settings: PluginSettings): SettingsViewMode {
    if (settings.settingsViewMode === 'wizard' || settings.settingsViewMode === 'tabs') {
        return settings.settingsViewMode;
    }

    if (settings.onboardingCompleted || hasConfiguredSetup(settings)) {
        return 'tabs';
    }

    return 'wizard';
}

export function validateAsrStep(settings: PluginSettings): ValidationResult {
    const errors: string[] = [];

    if (settings.transcriptionProvider === TranscriptionProvider.ZHIPU) {
        if (!hasText(settings.zhipuApiKey)) {
            errors.push('请填写 Zhipu ASR API key');
        }
    }

    if (settings.transcriptionProvider === TranscriptionProvider.VOLCENGINE) {
        if (!hasText(settings.volcengineAppId)) {
            errors.push('请填写 VolcEngine App ID');
        }
        if (!hasText(settings.volcengineAccessToken)) {
            errors.push('请填写 VolcEngine Access Token');
        }
    }

    if (settings.transcriptionProvider === TranscriptionProvider.LOCAL_WHISPER) {
        if (!hasText(settings.whisperServerUrl)) {
            errors.push('请填写 Local Whisper Server URL');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

export function validateLlmStep(settings: PluginSettings): ValidationResult {
    const errors: string[] = [];

    if (settings.llmProvider === LLMProvider.OPENROUTER && !hasText(settings.openRouterApiKey)) {
        errors.push('请填写 OpenRouter API key');
    }

    if (settings.llmProvider === LLMProvider.GEMINI && !hasText(settings.geminiApiKey)) {
        errors.push('请填写 Gemini API key');
    }

    if (settings.llmProvider === LLMProvider.OPENAI && !hasText(settings.openAIApiKey)) {
        errors.push('请填写 OpenAI API key');
    }

    if (settings.llmProvider === LLMProvider.ANTHROPIC && !hasText(settings.anthropicApiKey)) {
        errors.push('请填写 Anthropic API key');
    }

    if (settings.llmProvider === LLMProvider.ZHIPU && !hasText(settings.zhipuLLMApiKey)) {
        errors.push('请填写 Zhipu LLM API key');
    }

    if (settings.llmProvider === LLMProvider.MINIMAX && !hasText(settings.minimaxApiKey)) {
        errors.push('请填写 Minimax API key');
    }

    if (settings.llmProvider === LLMProvider.DEEPSEEK && !hasText(settings.deepseekApiKey)) {
        errors.push('请填写 DeepSeek API key');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
