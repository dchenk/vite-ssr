import React, { ReactElement } from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { deserializeState } from '../utils/deserialize-state';
import { withoutSuffix } from '../utils/route';
import type { PagePropsOptions, SharedOptions } from '../utils/types';
import type { ClientHandler, ClientOptions, Context } from './types';
import { createRouter } from './utils';
import { provideContext } from './components.js';

export { useContext } from './components.js';

const createClientContext = (
  url: URL,
  transformState: SharedOptions['transformState'] = deserializeState,
  routes: ClientOptions['routes'],
  base: ClientOptions['base'],
  pagePropsOptions: PagePropsOptions | undefined,
  PropsProvider: ClientOptions['PropsProvider'],
): Context => {
  // Deserialize the state included in the DOM.
  const initialState = transformState(
    // @ts-ignore
    window.__INITIAL_STATE__,
    deserializeState,
  ) || {};

  return {
    url,
    isClient: true,
    initialState,
    redirect: () => {
      console.warn('[SSR] Do not call redirect in browser');
    },
    writeResponse: () => {
      console.warn('[SSR] Do not call writeResponse in browser');
    },
    router: createRouter({
      routes,
      base,
      initialState,
      pagePropsOptions,
      PropsProvider,
    }),
  };
};

export const viteSSR: ClientHandler = async function (
  App,
  {
    routes,
    base,
    suspenseFallback,
    PropsProvider,
    pageProps,
    debug = {},
    ...options
  },
  hook,
) {
  const url = new URL(window.location.href);
  const routeBase = base && withoutSuffix(base({ url }), '/');

  const ctx = await createClientContext(
    url,
    options.transformState,
    routes,
    base,
    pageProps,
    PropsProvider,
  );

  const context = ctx as Context;

  if (hook) {
    await hook(context);
  }

  let app: ReactElement = React.createElement(
    React.Suspense,
    { fallback: suspenseFallback || '' },
    React.createElement(
      HelmetProvider,
      {},
      React.createElement(
        // @ts-ignore
        BrowserRouter,
        { basename: routeBase },
        provideContext(React.createElement(App, context), context),
      ),
    ),
  );

  if (debug.mount !== false) {
    // @ts-ignore
    const el = document.getElementById(__CONTAINER_ID__);

    // @ts-ignore
    __DEV__
      ? // @ts-ignore
      ReactDOM.createRoot(el).render(app)
      : // @ts-ignore
      ReactDOM.hydrateRoot(el, app);
  }
};

export default viteSSR;
