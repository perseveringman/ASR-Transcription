import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        include: ['**/*.test.ts'],
        alias: {
            'obsidian': './__mocks__/obsidian.ts'
        }
    }
});
