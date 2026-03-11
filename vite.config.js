import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
export default defineConfig(function (_a) {
    var _b;
    var mode = _a.mode;
    var env = loadEnv(mode, '.', '');
    return {
        base: (_b = env.VITE_BASE_PATH) !== null && _b !== void 0 ? _b : '/',
        plugins: [react()],
        test: {
            environment: 'jsdom',
            setupFiles: './src/test/setup.ts',
            css: true,
        },
    };
});
