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
    OPENROUTER = 'openrouter'
}

export interface PluginSettings {
    transcriptionProvider: TranscriptionProvider;
    zhipuApiKey: string;
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
    
    // AI Polishing Settings
    enableAiPolishing: boolean;
    llmProvider: LLMProvider;
    openRouterApiKey: string;
    openRouterModel: string;
    systemPrompt: string;
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

    // AI Polishing Defaults
    enableAiPolishing: false,
    llmProvider: LLMProvider.OPENROUTER,
    openRouterApiKey: '',
    openRouterModel: 'google/gemini-2.0-flash-exp:free',
    systemPrompt: "You are a helpful assistant that polishes transcribed speech. Your task is to fix typos, remove redundancies (like 'um', 'ah', repeated words), and ensure sentences are grammatically correct and flow smoothly. DO NOT change the original structure, meaning, or tone. DO NOT add any introductory or concluding remarks. Output ONLY the polished text."
};