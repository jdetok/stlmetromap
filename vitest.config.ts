import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        globals: false,
        setupFiles: ['./www/tests/setup.ts'],
        css: false,
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.d.ts'],
        },
    },
})