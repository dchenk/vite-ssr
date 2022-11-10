import { createUrl } from '../utils/route'
import { useSsrResponse } from '../utils/response'
import { serializeState } from '../utils/serialize-state'
import {
  buildHtmlDocument,
  findDependencies,
  renderPreloadLinks,
} from '../utils/html'
import type { Renderer, SharedContext, SharedOptions } from '../utils/types';

export interface SSRPageDescriptor {
  headTags?: string
  htmlAttrs?: string
  bodyAttrs?: string
  body?: string
}

const getEmptyHtmlParts = () => ({
  headTags: '',
  htmlAttrs: '',
  bodyAttrs: '',
  body: '',
  initialState: undefined as any,
  dependencies: [] as string[],
})

export const coreViteSSR = function viteSSR(
  options: SharedOptions,
  renderer: (
    context: SharedContext,
    utils: { isRedirect: () => boolean; [key: string]: unknown }
  ) => Promise<SSRPageDescriptor>,
): Renderer {
  const { transformState = serializeState } = options as Pick<SharedOptions, 'transformState'>

  return async function (
    url,
    {
      manifest,
      preload = false,
      skip = false,
      template = `__VITE_SSR_HTML__`, // This string is transformed at build time
      ...extra
    } = {}
  ) {
    if (skip) {
      return { html: template, ...getEmptyHtmlParts() }
    }

    url = createUrl(url)

    const { deferred, response, writeResponse, redirect, isRedirect } = useSsrResponse();

    const context: SharedContext = {
      url,
      isClient: false,
      initialState: {},
      redirect,
      writeResponse,
      ...extra,
    };

    // Wait for either rendering finished or redirection detected
    const payload = await Promise.race([
      renderer(context, { ...extra, isRedirect }), // Resolves when rendering to string is done
      deferred.promise, // Resolves when 'redirect' is called
    ]);

    // The 'redirect' utility has been called during rendering: skip everything else
    if (isRedirect()) return response

    // Not a redirect: get the HTML parts returned by the renderer and continue
    const htmlParts = {
      ...getEmptyHtmlParts(),
      ...(payload as SSRPageDescriptor),

      // Serialize the state to include it in the DOM
      initialState: await transformState(
        context.initialState || {},
        serializeState
      ),
    }

    // If a manifest is provided and the current framework is able to add
    // modules to the context (e.g. Vue) while rendering, collect the dependencies.
    if (manifest) {
      htmlParts.dependencies = findDependencies(context.modules, manifest)

      if (preload && htmlParts.dependencies.length > 0) {
        htmlParts.headTags += renderPreloadLinks(htmlParts.dependencies)
      }
    }

    return {
      html: buildHtmlDocument(template, htmlParts),
      ...htmlParts,
      ...response,
    }
  }
}
