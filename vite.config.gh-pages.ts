import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages production config - updated for custom domain
export default defineConfig({
  plugins: [react()],
  base: '/', // Use root path for custom domain
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
