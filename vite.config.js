import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, 'src', 'renderer'),
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true
  }
});