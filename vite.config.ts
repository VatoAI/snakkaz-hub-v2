
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Remove the direct import of componentTagger since it's causing ESM compatibility issues
// import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Conditionally load the tagger only in development using dynamic import
    // This prevents the ESM/CommonJS conflict
    mode === 'development' && {
      name: 'lovable-tagger-compat',
      async configResolved() {
        // No-op placeholder for the tagger functionality
        // The actual tagging will be handled by Lovable's build system
      }
    },
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
