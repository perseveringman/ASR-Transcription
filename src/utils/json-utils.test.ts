import { describe, it, expect } from 'vitest';
import { safeParseJson } from './json-utils';

describe('safeParseJson', () => {
    it('should parse valid JSON', () => {
        const input = '{"key": "value"}';
        const result = safeParseJson<{key: string}>(input);
        expect(result).toEqual({key: "value"});
    });

    it('should parse JSON from markdown code block', () => {
        const input = '```json\n{"key": "value"}\n```';
        const result = safeParseJson<{key: string}>(input);
        expect(result).toEqual({key: "value"});
    });

    it('should return null for invalid JSON', () => {
        const input = '{invalid}';
        const result = safeParseJson(input);
        expect(result).toBeNull();
    });

    it('should handle whitespace', () => {
        const input = '   {"key": "value"}   ';
        const result = safeParseJson<{key: string}>(input);
        expect(result).toEqual({key: "value"});
    });
});
