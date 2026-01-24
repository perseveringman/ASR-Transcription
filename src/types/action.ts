export interface AIAction {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    systemPrompt: string;
    userPromptTemplate?: string; // {{content}} variable
    outputMode: 'append' | 'replace' | 'new-note' | 'modal';
}

export interface ActionCategory {
    id: string;
    name: string;
    actions: AIAction[];
}
