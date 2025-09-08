import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Use repository name as base so assets resolve correctly on GitHub Pages
  base: '/relativity-visualizer/',
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
