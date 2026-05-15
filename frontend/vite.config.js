import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls to backend during development
    proxy: {
      '/auth':     { target: 'http://localhost:5000', changeOrigin: true },
      '/notes':    { target: 'http://localhost:5000', changeOrigin: true },
      '/shared':   { target: 'http://localhost:5000', changeOrigin: true },
      '/insights': { target: 'http://localhost:5000', changeOrigin: true },
      '/health':   { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
