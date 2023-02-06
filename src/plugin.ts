import type { Plugin } from 'vite';
import type { ViteSsrPluginOptions } from './config';
import { createSSRDevHandler, SsrOptions } from './dev/server';

const pluginName = 'vite-ssr-react';

export function viteSSRPlugin(
  options: ViteSsrPluginOptions & SsrOptions,
): Array<Plugin & Record<string, any>> {
  const nameToMatch = options.plugin || pluginName;

  return [
    {
      name: pluginName,
      enforce: 'pre',
      viteSsrOptions: options,
      config(config, env) {
        return {
          define: {
            // Vite 2.6.0 bug: use this
            // instead of import.meta.env.DEV
            __DEV__: env.mode !== 'production',
          },
          ssr: {
            external: [],
            noExternal: [pluginName],
          },
        };
      },
      // This does not appear to affect the build.
      // configResolved: (config) => {
      // @ts-ignore
      // config.optimizeDeps = config.optimizeDeps || {};
      // config.optimizeDeps.include = config.optimizeDeps.include || [];
      // config.optimizeDeps.include.push(
      //   `${nameToMatch}/react/entry-client.js`,
      //   `${nameToMatch}/react/entry-server.js`,
      // );
      // },
      async configureServer(server) {
        if (process.env.__DEV_MODE_SSR) {
          const handler = createSSRDevHandler(server, options);
          return () => server.middlewares.use(handler);
        }
      },

      // Implement auto-entry using virtual modules:
      resolveId(source, importer, options) {
        if (source === nameToMatch) {
          return `virtual:${nameToMatch}/dist/index.js`;
        }
      },
      load(id, options) {
        if (id === `virtual:${nameToMatch}/dist/index.js`) {
          const libPath = `${nameToMatch}/dist/react/entry-${
            options?.ssr ? 'server' : 'client'
          }.js`;
          return `export { viteSSR } from '${libPath}';`;
        }
      },
    },
  ];
}
