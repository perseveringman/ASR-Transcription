import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../types/config';
import {
    getInitialSettingsMode,
    hasAnyCredential,
    hasConfiguredSetup,
    validateAsrStep,
    validateLlmStep,
} from './settings-state';

function createSettings() {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

describe('settings-state', () => {
    describe('hasAnyCredential', () => {
        it('在无任何凭证时返回 false', () => {
            const settings = createSettings();
            expect(hasAnyCredential(settings)).toBe(false);
        });

        it('存在 ASR 凭证时返回 true', () => {
            const settings = createSettings();
            settings.zhipuApiKey = 'test-key';
            expect(hasAnyCredential(settings)).toBe(true);
        });

        it('存在 LLM 凭证时返回 true', () => {
            const settings = createSettings();
            settings.openAIApiKey = 'test-key';
            expect(hasAnyCredential(settings)).toBe(true);
        });
    });

    describe('hasConfiguredSetup', () => {
        it('本地 Whisper 有 URL 时视为已配置', () => {
            const settings = createSettings();
            settings.transcriptionProvider = 'local-whisper';
            settings.whisperServerUrl = 'http://localhost:9000';
            expect(hasConfiguredSetup(settings)).toBe(true);
        });

        it('无凭证且本地 Whisper URL 为空时视为未配置', () => {
            const settings = createSettings();
            settings.transcriptionProvider = 'local-whisper';
            settings.whisperServerUrl = '';
            expect(hasConfiguredSetup(settings)).toBe(false);
        });
    });

    describe('getInitialSettingsMode', () => {
        it('新用户默认返回 wizard', () => {
            const settings = createSettings();
            expect(getInitialSettingsMode(settings)).toBe('wizard');
        });

        it('设置 viewMode 为 tabs 时返回 tabs', () => {
            const settings = createSettings();
            settings.settingsViewMode = 'tabs';
            expect(getInitialSettingsMode(settings)).toBe('tabs');
        });

        it('设置 viewMode 为 wizard 时优先返回 wizard', () => {
            const settings = createSettings();
            settings.geminiApiKey = 'g-key';
            settings.settingsViewMode = 'wizard';
            expect(getInitialSettingsMode(settings)).toBe('wizard');
        });
    });

    describe('validateAsrStep', () => {
        it('Zhipu 未填 key 时返回错误', () => {
            const settings = createSettings();
            settings.transcriptionProvider = 'zhipu';
            const result = validateAsrStep(settings);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('请填写 Zhipu ASR API key');
        });

        it('Local Whisper 未填 URL 时返回错误', () => {
            const settings = createSettings();
            settings.transcriptionProvider = 'local-whisper';
            settings.whisperServerUrl = '';
            const result = validateAsrStep(settings);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('请填写 Local Whisper Server URL');
        });
    });

    describe('validateLlmStep', () => {
        it('OpenAI 未填 key 时返回错误', () => {
            const settings = createSettings();
            settings.llmProvider = 'openai';
            const result = validateLlmStep(settings);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('请填写 OpenAI API key');
        });

        it('OpenAI 填写 key 后校验通过', () => {
            const settings = createSettings();
            settings.llmProvider = 'openai';
            settings.openAIApiKey = 'sk-test';
            const result = validateLlmStep(settings);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });
});
