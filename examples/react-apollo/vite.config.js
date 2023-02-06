import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSSRPlugin } from 'vite-ssr-react/plugin';
import api from '../node-server/api';

module.exports = defineConfig({
  plugins: [
    viteSSRPlugin(),
    react(),
    {
      // Mock API during development
      configureServer({ middlewares }) {
        api.forEach(({ route, handler }) => middlewares.use(route, handler));
      },
    },
  ],
});
