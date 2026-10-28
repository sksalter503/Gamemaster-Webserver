import { defineConfig } from 'vitest/config';

export default defineConfig({
    root: '.',
    test: {
        include: [
            'src/client/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            'src/server/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            'src/shared/**/*.{test,spec}.?(c|m)[jt]s?(x)',
        ],
    },
});