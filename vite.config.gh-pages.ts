import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages production config
export default defineConfig({
  plugins: [react()],
  base: '/online-designer-beta/',
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
