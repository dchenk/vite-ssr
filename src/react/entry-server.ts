import { getMarkupFromTree } from '@apollo/client/react/ssr';
import { createElement, ReactElement, ReactNode, Suspense } from 'react'
import ssrPrepass from 'react-ssr-prepass'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import { getFullPath, withoutSuffix } from '../utils/route'
import { createRouter } from './utils'
import coreViteSSR from '../core/entry-server.js'
import type { Context, SsrHandler } from './types'
import { provideContext } from './components.js'

export { useContext } from './components.js'

const render = (component: ReactNode) =>
  getMarkupFromTree({
    tree: component,
    renderFunction: renderToString
  });

const viteSSR: SsrHandler = function (
  App,
  {
    routes,
    base,
    prepassVisitor,
    PropsProvider,
    pageProps,
    styleCollector,
    ...options
  },
  hook
) {
  return coreViteSSR(options, async (ctx, { isRedirect, ...extra }) => {
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
    const helmetContext: Record<string, Record<string, string>> = {}

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

    const styles = styleCollector && (await styleCollector(context))
    if (styles) {
      app = styles.collect(app)
    }

    await ssrPrepass(app, prepassVisitor)
    const body = await render(app)

    if (isRedirect()) {
      styles && styles.cleanup && styles.cleanup()
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
      htmlAttributes: htmlAttrs = '',
      bodyAttributes: bodyAttrs = '',
      ...tags
    } = helmetContext.helmet || {}

    const styleTags: string = (styles && styles.toString(body)) || ''
    styles && styles.cleanup && styles.cleanup()

    const headTags =
      Object.keys(tags)
        .map((key) => (tags[key] || '').toString())
        .join('') +
      '\n' +
      styleTags

    return { body, headTags, htmlAttrs, bodyAttrs }
  })
}

export default viteSSR
