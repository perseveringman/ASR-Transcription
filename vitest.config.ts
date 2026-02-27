import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            obsidian: fileURLToPath(new URL('./__mocks__/obsidian.ts', import.meta.url))
        }
    },
    test: {
        environment: 'happy-dom',
        include: ['**/*.test.ts']
    }
});
