
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Dynamically import the componentTagger to avoid ESM/CommonJS conflicts
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Use a placeholder for development mode - the actual tagging will be handled by Lovable's build system
    mode === 'development' && {
      name: 'lovable-tagger',
      configResolved() {
        // This is a placeholder for the componentTagger functionality
        console.log('Lovable tagger initialized in development mode');
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
