export enum InsertPosition {
    CURSOR = 'cursor',
    DOCUMENT_END = 'document-end',
    NEW_NOTE = 'new-note'
}

export enum TranscriptionProvider {
    ZHIPU = 'zhipu',
    VOLCENGINE = 'volcengine'
}

export enum LLMProvider {
    OPENROUTER = 'openrouter',
    GEMINI = 'gemini',
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    ZHIPU = 'zhipu',
    MINIMAX = 'minimax',
    DEEPSEEK = 'deepseek'
}

export interface PluginSettings {
    transcriptionProvider: TranscriptionProvider;
    zhipuApiKey: string; // For ASR
    volcengineAppId: string;
    volcengineAccessToken: string;
    insertPosition: InsertPosition;
    addTimestamp: boolean;
    addSeparator: boolean;
    audioSaveFolder: string;
    hotwords: string[];
    contextPrompt: string;
    debugLogging: boolean;
    retryCount: number;
    timeout: number;
    templatePath: string;
    voiceNoteFolder: string;
    aiActionNoteFolder: string;
    
    // AI Polishing Settings
    enableAiPolishing: boolean;
    llmProvider: LLMProvider;
    systemPrompt: string;

    // Provider Specific Settings
    openRouterApiKey: string;
    openRouterModel: string;

    geminiApiKey: string;
    geminiModel: string;

    openAIApiKey: string;
    openAIModel: string;
    openAIBaseUrl: string; // Support custom proxies

    anthropicApiKey: string;
    anthropicModel: string;

    zhipuLLMApiKey: string; // Separate from ASR key potentially, or reuse? Better separate for clarity.
    zhipuLLMModel: string;

    minimaxApiKey: string;
    minimaxGroupId: string;
    minimaxModel: string;

    deepseekApiKey: string;
    deepseekModel: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    transcriptionProvider: TranscriptionProvider.ZHIPU,
    zhipuApiKey: '',
    volcengineAppId: '',
    volcengineAccessToken: '',
    insertPosition: InsertPosition.CURSOR,
    addTimestamp: true,
    addSeparator: true,
    audioSaveFolder: '/',
    hotwords: [],
    contextPrompt: '',
    debugLogging: false,
    retryCount: 3,
    timeout: 30000,
    templatePath: '',
    voiceNoteFolder: '/',
    aiActionNoteFolder: '思维涌现',

    // AI Polishing Defaults
    enableAiPolishing: false,
    llmProvider: LLMProvider.OPENROUTER,
    systemPrompt: "You are a helpful assistant that polishes transcribed speech. Your task is to fix typos, remove redundancies (like 'um', 'ah', repeated words), and ensure sentences are grammatically correct and flow smoothly. DO NOT change the original structure, meaning, or tone. DO NOT add any introductory or concluding remarks. Output ONLY the polished text.",

    openRouterApiKey: '',
    openRouterModel: 'google/gemini-2.0-flash-exp:free',

    geminiApiKey: '',
    geminiModel: 'gemini-2.0-flash',

    openAIApiKey: '',
    openAIModel: 'gpt-4o-mini',
    openAIBaseUrl: 'https://api.openai.com/v1',

    anthropicApiKey: '',
    anthropicModel: 'claude-3-5-sonnet-latest',

    zhipuLLMApiKey: '',
    zhipuLLMModel: 'glm-4-flash',

    minimaxApiKey: '',
    minimaxGroupId: '',
    minimaxModel: 'abab6.5s-chat',

    deepseekApiKey: '',
    deepseekModel: 'deepseek-chat'
};
