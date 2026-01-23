export enum InsertPosition {
    CURSOR = 'cursor',
    DOCUMENT_END = 'document-end',
    NEW_NOTE = 'new-note'
}

export enum TranscriptionProvider {
    ZHIPU = 'zhipu',
    VOLCENGINE = 'volcengine'
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
    voiceNoteFolder: '/'
};
