import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSSRPlugin } from 'vite-ssr-react/plugin';

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [viteSSRPlugin(), react()],
});
