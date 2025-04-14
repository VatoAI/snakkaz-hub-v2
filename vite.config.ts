
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
    // Ensure __WS_TOKEN__ is defined for all environments
    __WS_TOKEN__: JSON.stringify(process.env.WS_TOKEN || 'development-ws-token'),
  },
  server: {
    port: 8080,
    host: '::',
  },
}));
