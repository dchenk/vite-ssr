import { createElement, FunctionComponent, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { ContextProvider } from '../context';
import { Options } from '../index';
import { deserializeState } from '../utils/deserialize-state';
import type { Context } from '../utils/types';

export const viteSSR = <InitialState>(
  App: FunctionComponent<Context<InitialState>>,
  { debug = {}, suspenseFallback, transformStateClient }: Options<InitialState, never>,
): void => {
  const initialStateStr = (window as unknown as { __INITIAL_STATE__: string }).__INITIAL_STATE__;

  const context: Context<InitialState> = {
    initialState: transformStateClient(deserializeState(initialStateStr)),
  };

  const app = createElement(
    Suspense,
    { fallback: suspenseFallback || '' },
    createElement(
      HelmetProvider,
      {},
      createElement(
        BrowserRouter,
        {},
        createElement(ContextProvider, { value: context as never }, createElement(App, context)),
      ),
    ),
  );

  if (debug.mount !== false) {
    const el = document.getElementById('app') as HTMLElement;

    ReactDOM.createRoot(el).render(app);
  }
};
