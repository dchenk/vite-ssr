import { createElement, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { ContextProvider } from '../context';
import { deserializeState } from '../utils/deserialize-state';
import { withoutSuffix } from '../utils/route';
import type { SharedContext, SharedOptions } from '../utils/types';
import type { ClientHandler } from './types';

const createClientContext = (
  url: URL,
  transformState: SharedOptions['transformState'] = deserializeState,
): SharedContext => {
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
  };
};

export const viteSSR: ClientHandler = async function (
  App,
  {
    base,
    suspenseFallback,
    pageProps,
    debug = {},
    ...options
  },
  hook,
) {
  const url = new URL(window.location.href);
  const routeBase = base && withoutSuffix(base({ url }), '/');

  const context = await createClientContext(
    url,
    options.transformState,
  );

  await hook(context);

  const app = createElement(
    Suspense,
    { fallback: suspenseFallback || '' },
    createElement(
      HelmetProvider,
      {},
      createElement(
        BrowserRouter,
        { basename: routeBase },
        createElement(ContextProvider, { value: context }, createElement(App, context)),
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
