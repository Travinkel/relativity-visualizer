import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Use repository name as base only for production (e.g., GitHub Pages). Use root in dev.
  base: mode === 'production' ? '/relativity-visualizer/' : '/',
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
    // Let Vite infer HMR settings; overriding can cause wrong client URL in some setups
  },
}));
