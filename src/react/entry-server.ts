import { FunctionComponent } from 'react';
import { Options } from '../index';
import { buildHtmlDocument } from '../utils/html';
import { serializeState } from '../utils/serialize-state';
import type { Context, Rendered, Renderer, RendererOptions, WriteResponse } from '../utils/types';

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

export const viteSSR = <InitialState, EndStateServer>(
  App: FunctionComponent<Context<InitialState>>,
  { setupStateSSR, transformStateSSR }: Options<InitialState, EndStateServer>,
): Renderer<InitialState> => {
  // This string is transformed at build time. It must be a template string to allow newlines within it.
  // eslint-disable-next-line quotes
  const template = `__VITE_SSR_HTML__`;

  return async (options: RendererOptions): Promise<Rendered<InitialState> | WriteResponse> => {
    // The transformStateSSR hook is able to ultimately decide what the response will be.
    const [serverEndState, renderedResponse] = transformStateSSR(await setupStateSSR(options));

    const htmlParts = {
      ...getEmptyHtmlParts<InitialState>(),
      // Serialize the state to include it in the DOM.
      initialState: serializeState(serverEndState),
    };

    return {
      ...htmlParts,
      ...(renderedResponse || {}),
      html: buildHtmlDocument(options.template || template, htmlParts),
    };
  };
};
