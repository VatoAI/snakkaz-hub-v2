
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'window',
    // Define __WS_TOKEN__ as a string literal for all builds
    __WS_TOKEN__: JSON.stringify('development-ws-token'),
  },
  server: {
    port: 8080,
    host: '::',
  },
}));
