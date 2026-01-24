export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMService {
    readonly name: string;
    complete(messages: LLMMessage[]): Promise<string>;
}
