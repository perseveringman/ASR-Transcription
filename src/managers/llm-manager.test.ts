import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMManager } from './llm-manager';
import { LLMServiceFactory } from '../services/llm/factory';
import { DEFAULT_SETTINGS, LLMProvider } from '../types/config';

vi.mock('../services/llm/factory', () => ({
    LLMServiceFactory: {
        create: vi.fn()
    }
}));

describe('LLMManager', () => {
    let mockService: any;
    
    beforeEach(() => {
        vi.clearAllMocks();
        mockService = {
            complete: vi.fn().mockResolvedValue('Polished text')
        };
        (LLMServiceFactory.create as any).mockReturnValue(mockService);
    });

    it('should select the correct prompt based on styleId', async () => {
        const settings = {
            ...DEFAULT_SETTINGS,
            enableAiPolishing: true,
            selectedStylePresetId: 'default',
            stylePresets: [
                { id: 'default', name: 'Default', prompt: 'Default Prompt' },
                { id: 'custom', name: 'Custom', prompt: 'Custom Prompt' }
            ]
        };

        const manager = new LLMManager(settings as any);
        
        await manager.polish('hello');
        expect(mockService.complete).toHaveBeenCalledWith([
            { role: 'system', content: 'Default Prompt' },
            { role: 'user', content: 'hello' }
        ]);

        await manager.polish('hello', 'custom');
        expect(mockService.complete).toHaveBeenCalledWith([
            { role: 'system', content: 'Custom Prompt' },
            { role: 'user', content: 'hello' }
        ]);
    });

    it('should return empty string if polishing is disabled', async () => {
        const settings = {
            ...DEFAULT_SETTINGS,
            enableAiPolishing: false
        };

        const manager = new LLMManager(settings as any);
        const result = await manager.polish('hello');
        
        expect(result).toBe('');
        expect(mockService.complete).not.toHaveBeenCalled();
    });

    it('should throw error if service fails', async () => {
        mockService.complete.mockRejectedValue(new Error('API Error'));
        
        const settings = {
            ...DEFAULT_SETTINGS,
            enableAiPolishing: true
        };

        const manager = new LLMManager(settings as any);
        
        await expect(manager.polish('hello')).rejects.toThrow('API Error');
    });
});
