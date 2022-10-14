// This file is overwritten by the plugin to
// redirect to a specific implementation.

declare module 'vite-ssr' {
  export const viteSSR: (
    App: any,
    options: import('./utils/types').SharedOptions & {
      routes: Array<Record<string, any>>
      routerOptions?: Record<string, any>
      styleCollector?: (ctx: any) => any
    },
    hook?: (
      params: import('./utils/types').SharedContext & {
        app: any
        router: any
        initialRoute: any
      }
    ) => any
  ) => any

  export const useContext: () => import('./utils/types').SharedContext
}
