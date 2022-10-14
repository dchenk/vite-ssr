import type { Plugin } from 'vite';
import { normalizePath } from 'vite';
import type { ViteSsrPluginOptions } from './config';
import { createSSRDevHandler, SsrOptions } from './dev/server';

const pluginName = 'vite-ssr-react';

export function viteSSRPlugin(
  options: ViteSsrPluginOptions & SsrOptions = {}
): Array<Plugin & Record<string, any>> {
  const nameToMatch = options.plugin || pluginName;
  const autoEntryRE = new RegExp(`${nameToMatch}/react`);

  return [
    {
      name: pluginName,
      enforce: 'pre',
      viteSsrOptions: options,
      config(config, env) {
        return {
          define: {
            __CONTAINER_ID__: JSON.stringify(options.containerId || 'app'),
            // Vite 2.6.0 bug: use this
            // instead of import.meta.env.DEV
            __DEV__: env.mode !== 'production',
          },
          ssr: {
            external: [],
            noExternal: [pluginName],
          },
        }
      },
      configResolved: (config) => {
        // @ts-ignore
        config.optimizeDeps = config.optimizeDeps || {}
        config.optimizeDeps.include = config.optimizeDeps.include || []
        config.optimizeDeps.include.push(
          `${nameToMatch}/react/entry-client`,
          `${nameToMatch}/react/entry-server`,
        )
      },
      async configureServer(server) {
        if (process.env.__DEV_MODE_SSR) {
          const handler = createSSRDevHandler(server, options)
          return () => server.middlewares.use(handler)
        }
      },

      // Implement auto-entry using virtual modules:
      resolveId(source, importer, options) {
        if (source.includes(nameToMatch)) {
          source = normalizePath(source)
          if (autoEntryRE.test(source)) {
            return `virtual:${source}/index.js`
          }
        }
      },
      load(id, options) {
        if (id.startsWith(`virtual:${nameToMatch}`)) {
          id = normalizePath(id)
          let [, lib = ''] = id.split('/')
          if (lib === 'index.js') {
            lib = 'react';
          }

          const libPath = `'${nameToMatch}/${lib}/entry-${
            options?.ssr ? 'server' : 'client'
          }'`

          return `export * from ${libPath}; export { default } from ${libPath}`
        }
      },
    },
  ]
}
