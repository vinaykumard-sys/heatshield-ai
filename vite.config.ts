import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@heatshield/types': path.resolve(__dirname, './packages/types/index.ts'),
      '@heatshield/core': path.resolve(__dirname, './packages/core/index.ts'),
      '@heatshield/api': path.resolve(__dirname, './packages/api/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    cors: true,
  },
});
