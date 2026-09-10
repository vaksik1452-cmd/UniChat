import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5173,
        watch: {
            usePolling: true,
        },
        proxy: {
            '/api': {
                target: 'http://host.docker.internal:3000',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://host.docker.internal:3000',
                changeOrigin: true,
                ws: true,
            },
        },
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
});
