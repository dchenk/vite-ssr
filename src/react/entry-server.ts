import { getMarkupFromTree } from '@apollo/client/react/ssr';
import { createElement, FunctionComponent, Suspense } from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetData, HelmetProvider, HelmetServerState } from 'react-helmet-async';
import { StaticRouter } from 'react-router-dom/server';
import ssrPrepass from 'react-ssr-prepass';
import { ContextProvider } from '../context';
import { buildHtmlDocument } from '../utils/html';
import { createUrl, withoutPrefix } from '../utils/route';
import { serializeState } from '../utils/serialize-state';
import type { Context, Rendered, Renderer, RendererOptions, WriteResponse } from '../utils/types';
import { defer } from '../utils/defer';
import { Options } from '../index';

/* This was used for the preload feature.
const findDependencies = (
  modules: string[],
  manifest: Record<string, string[]>,
) => {
  const files = new Set<string>();

  for (const moduleId of modules) {
    manifest[moduleId]?.forEach(file => {
      files.add(file);
    });
  }

  return [...files];
};
 */

const getEmptyHtmlParts = <T>(): Omit<Rendered<T>, 'initialState' | 'html'> => ({
  headTags: '',
  htmlAttrs: '',
  bodyAttrs: '',
  body: '',
  dependencies: [] as string[],
});

const isRedirectStatus = (status: number | undefined = 0) =>
  !!status && status >= 300 && status < 400;

export const viteSSR = <InitialState, EndStateServer>(App: FunctionComponent<Context<InitialState>>, {
  suspenseFallback,
  prepassVisitor,
  setupStateSSR,
  transformStateSSR,
}: Options<InitialState, EndStateServer>): Renderer<InitialState> => {
  const renderer = async (
    options: RendererOptions,
    writeResponse: (params: WriteResponse) => void,
  ): Promise<Omit<Rendered<InitialState>, 'html' | 'dependencies'>> => {
    const url = createUrl(options.url);

    const context: Context<InitialState> = {
      initialState: await setupStateSSR(options),
      writeResponse,
    };

    // const routerUrl = new URL(url);
    // routerUrl.pathname = withSuffix(routerUrl.pathname, '/');
    // const routerLocation = withoutPrefix(routerUrl.href, routerUrl.origin);
    const routerLocation = withoutPrefix(url.href, url.origin);

    const helmetContext: Partial<HelmetData['context']> = {};

    const app = createElement(
      Suspense,
      { fallback: suspenseFallback || '' },
      createElement(
        HelmetProvider,
        { context: helmetContext },
        createElement(
          StaticRouter,
          { location: routerLocation },
          createElement(
            ContextProvider,
            { value: context as never },
            createElement(App, context),
          ),
        ),
      ),
    );

    await ssrPrepass(app, prepassVisitor);

    const body = await getMarkupFromTree({
      tree: app,
      renderFunction: renderToString,
    });

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

    return { body, headTags, htmlAttrs, bodyAttrs, initialState: context.initialState };
  };

  // This string is transformed at build time. It must be a template string to allow newlines within it.
  // eslint-disable-next-line quotes
  const template = `__VITE_SSR_HTML__`;

  return async (options: RendererOptions): Promise<Rendered<InitialState> | WriteResponse> => {
    const deferred = defer<WriteResponse>();
    const response: WriteResponse = {};

    const writeResponse = (params: WriteResponse) => {
      Object.assign(response, params);
      if (isRedirectStatus(params.status)) {
        // Stop waiting for rendering when redirecting.
        deferred.resolve(response);
      }
    };

    const isRedirect = () => isRedirectStatus(response.status);

    // Wait for either rendering finished or redirection detected
    const payload = await Promise.race([
      renderer(options, writeResponse), // Resolves when rendering to string is done.
      deferred.promise, // Resolves when 'redirect' is called.
    ]);

    // The 'redirect' utility has been called during rendering. Skip everything else.
    if (isRedirect()) {
      return response;
    }

    // The transformStateSSR hook is able to ultimately decide what the response will be.
    const [serverEndState, renderedResponse] = payload && 'initialState' in payload
      ? transformStateSSR(payload.initialState)
      : [{}, payload];

    const htmlParts = {
      ...getEmptyHtmlParts<InitialState>(),
      ...(payload || {}),
      // Serialize the state to include it in the DOM.
      initialState: serializeState(serverEndState),
    };

    // If a manifest is provided and the current framework is able to add
    // modules to the context (e.g. Vue) while rendering, collect the dependencies.
    // TODO
    // if (options.manifest) {
    //   if (payload.modules) {
    //     htmlParts.dependencies = findDependencies(context.modules, options.manifest);
    //   }
    //
    //   if (options.preload && htmlParts.dependencies.length > 0) {
    //     htmlParts.headTags += renderPreloadLinks(htmlParts.dependencies);
    //   }
    // }

    return {
      ...htmlParts,
      ...response,
      ...(renderedResponse || {}),
      html: buildHtmlDocument(options.template || template, htmlParts),
    };
  };
};
