import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Use a relative base so the site works on GitHub Pages and local file URLs
  base: './',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      clientPort: 5173,
      protocol: 'ws',
    },
  },
});
