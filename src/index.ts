// This file is overwritten by the plugin to redirect to either entry-client or entry-server.
import type { ClientHandler, SsrHandler } from './react/types';
import type { SharedContext, SharedOptions } from './utils/types';

export declare function viteSSR (
  App: any,
  options: SharedOptions,
  hook: (
    params: SharedContext & {
      app: any
      initialRoute: any
    },
  ) => any,
): ClientHandler | SsrHandler;
