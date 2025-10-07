/* File: client/vite.config.js - Vite configuration for BrokenLink AI frontend */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [react()],
});
