import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import themePlugin from '@replit/vite-plugin-shadcn-theme-json';
import path, { dirname } from 'path';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const _dirname = dirname(filename);

export default defineConfig({
  root: path.resolve(_dirname, 'client'),
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
  ],
  resolve: {
    alias: {
      'client': path.resolve(_dirname, 'client', 'src'),
      '@': path.resolve(_dirname, 'client', 'src'),
      '@shared': path.resolve(_dirname, 'shared'),
      '@assets': path.resolve(_dirname, 'attached_assets'),
    },
  },
});