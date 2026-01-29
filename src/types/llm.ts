export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export type StreamCallback = (chunk: string, done: boolean) => void;

export interface LLMService {
    readonly name: string;
    complete(messages: LLMMessage[]): Promise<string>;
    
    /**
     * Stream completion with real-time chunks.
     * @param messages - The conversation messages
     * @param onChunk - Callback receiving each text chunk and done status
     * @returns Promise that resolves to the full response when complete
     */
    stream?(messages: LLMMessage[], onChunk: StreamCallback): Promise<string>;
    
    /**
     * Whether this service supports streaming
     */
    supportsStreaming?(): boolean;
}
