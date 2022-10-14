import { getMarkupFromTree } from '@apollo/client/react/ssr';
import { createElement, ReactNode, Suspense } from 'react';
import ssrPrepass from 'react-ssr-prepass';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetData, HelmetProvider, HelmetServerState } from 'react-helmet-async';
import { ContextProvider } from '../context';
import { coreViteSSR, SSRPageDescriptor } from '../core/entry-server';
import { getFullPath, withoutSuffix } from '../utils/route';
import type { SharedContext } from '../utils/types';
import type { SsrHandler } from './types';

const render = (component: ReactNode) =>
  getMarkupFromTree({
    tree: component,
    renderFunction: renderToString
  });

export const viteSSR: SsrHandler = function (
  App,
  {
    base,
    prepassVisitor,
    pageProps,
    ...options
  },
  hook
) {
  return coreViteSSR(options, async (ctx, { isRedirect, ...extra }): Promise<SSRPageDescriptor> => {
    const context: SharedContext = {
      ...ctx,
    };

    // context.initialState = (await hook(context)) || context.initialState
    await hook(context);

    if (isRedirect()) return {}

    const routeBase = base && withoutSuffix(base(context), '/')
    const fullPath = getFullPath(context.url, routeBase)
    const helmetContext: Partial<HelmetData['context']> = {}

    const app = createElement(
      Suspense,
      { fallback: '' },
      createElement(
        HelmetProvider,
        { context: helmetContext },
        createElement(
          StaticRouter,
          { basename: routeBase, location: fullPath },
          createElement(ContextProvider, { value: context }, createElement(App, context))
        )
      )
    )

    await ssrPrepass(app, prepassVisitor)
    const body = await render(app)

    if (isRedirect()) {
      return {}
    }

    const currentRoute = context.router.getCurrentRoute()
    if (currentRoute) {
      Object.assign(
        context.initialState || {},
        (currentRoute.meta || {}).state || {}
      )
    }

    const {
      htmlAttributes,
      bodyAttributes,
      ...tags
    } = helmetContext.helmet || {} as HelmetServerState;

    const htmlAttrs = (htmlAttributes || '').toString();
    const bodyAttrs = (bodyAttributes || '').toString();

    const headTags = Object.values(tags)
      .map(tag => tag.toString())
      .join('');

    return { body, headTags, htmlAttrs, bodyAttrs }
  });
}
