export enum InsertPosition {
    CURSOR = 'cursor',
    DOCUMENT_END = 'document-end',
    NEW_NOTE = 'new-note'
}

export interface PluginSettings {
    zhipuApiKey: string;
    insertPosition: InsertPosition;
    addTimestamp: boolean;
    addSeparator: boolean;
    newNoteFolder: string;
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
    zhipuApiKey: '',
    insertPosition: InsertPosition.CURSOR,
    addTimestamp: true,
    addSeparator: true,
    newNoteFolder: '/',
    audioSaveFolder: '/',
    hotwords: [],
    contextPrompt: '',
    debugLogging: false,
    retryCount: 3,
    timeout: 30000,
    templatePath: '',
    voiceNoteFolder: '/'
};
