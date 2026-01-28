export function safeParseJson<T>(text: string): T | null {
    try {
        let cleanText = text.trim();
        
        const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
        const match = cleanText.match(jsonBlockRegex);
        
        if (match && match[1]) {
            cleanText = match[1].trim();
        }

        return JSON.parse(cleanText) as T;
    } catch (e) {
        console.error('Failed to parse JSON from LLM response:', e);
        return null;
    }
}
