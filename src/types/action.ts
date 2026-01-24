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
}

export interface SubCategory {
    id: string;
    name: string;
    actions: AIAction[];
}

export interface RootCategory {
    id: string;
    name: string;
    subCategories: SubCategory[];
}

