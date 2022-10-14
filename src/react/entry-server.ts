import { getMarkupFromTree } from '@apollo/client/react/ssr';
import { createElement, ReactElement, ReactNode, Suspense } from 'react';
import ssrPrepass from 'react-ssr-prepass';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetData, HelmetProvider, HelmetServerState } from 'react-helmet-async';
import { getFullPath, withoutSuffix } from '../utils/route';
import { createRouter } from './utils';
import { coreViteSSR, SSRPageDescriptor } from '../core/entry-server';
import type { Context, SsrHandler } from './types';
import { provideContext } from './components.js';

export { useContext } from './components.js'

const render = (component: ReactNode) =>
  getMarkupFromTree({
    tree: component,
    renderFunction: renderToString
  });

export const viteSSR: SsrHandler = function (
  App,
  {
    routes,
    base,
    prepassVisitor,
    PropsProvider,
    pageProps,
    ...options
  },
  hook
) {
  return coreViteSSR(options, async (ctx, { isRedirect, ...extra }): Promise<SSRPageDescriptor> => {
    const context = ctx as Context
    context.router = createRouter({
      routes,
      base,
      initialState: (extra.initialState as Record<string, unknown>) || null,
      pagePropsOptions: pageProps,
      PropsProvider,
    })

    if (hook) {
      context.initialState = (await hook(context)) || context.initialState
    }

    if (isRedirect()) return {}

    const routeBase = base && withoutSuffix(base(context), '/')
    const fullPath = getFullPath(context.url, routeBase)
    const helmetContext: Partial<HelmetData['context']> = {}

    let app: ReactElement = createElement(
      Suspense,
      { fallback: '' },
      createElement(
        HelmetProvider,
        { context: helmetContext },
        createElement(
          StaticRouter,
          { basename: routeBase, location: fullPath },
          provideContext(createElement(App, context), context)
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
