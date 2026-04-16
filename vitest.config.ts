import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        globals: false,
        setupFiles: ['./www/tests/setup.ts'],
        css: false,
        coverage: {
            provider: 'v8',
            include: ['www/src/**/*.ts'],
            exclude: [
                'www/src/**/*.d.ts',
                'www/src/layers.ts',
                'www/src/main.ts',
                'www/src/cmp/*.ts',
            ],
        },
    },
});