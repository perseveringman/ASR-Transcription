export interface AIAction {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    systemPrompt: string;
    userPromptTemplate?: string; // {{content}} variable
    outputMode: 'append' | 'replace' | 'new-note' | 'modal';
}

export type SourceType = 'current-note' | 'date-range';

export interface SourceConfig {
    type: SourceType;
    // We can store pre-selected dates here if we want to persist them in the UI state
    // but for now, we'll prompt if needed.
}

export interface ActionCategory {
    id: string;
    name: string;
    actions: AIAction[];
}
