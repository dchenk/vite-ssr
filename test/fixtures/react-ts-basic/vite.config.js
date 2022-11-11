import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSSRPlugin } from 'vite-ssr-react/plugin';

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [
    viteSSRPlugin(),
    react(),
  ],
});
