const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')
const { viteSSRPlugin } = require('vite-ssr/plugin')
const api = require('../node-server/api')

module.exports = defineConfig({
  plugins: [
    viteSSRPlugin(),
    react(),
    {
      // Mock API during development
      configureServer({ middlewares }) {
        api.forEach(({ route, handler }) => middlewares.use(route, handler))
      },
    },
  ],
})
