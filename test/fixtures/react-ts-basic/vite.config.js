const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const { viteSSRPlugin } = require('vite-ssr-react/plugin');

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [
    viteSSRPlugin(),
    react(),
  ],
});
