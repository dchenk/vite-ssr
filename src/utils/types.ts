import type { ServerResponse } from 'http';
import type { Request } from 'express';

export interface Context<InitialState> {
  initialState: InitialState;
  // writeResponse is defined only in SSR.
  writeResponse?: (params: WriteResponse) => void;
  // modules is added by the plugin if necessary.
  modules?: string[];
}

export interface WriteResponse {
  status?: number
  statusText?: string
  headers?: Record<string, string>
}

export type Rendered<InitialState> = WriteResponse & {
  initialState: InitialState;
  html: string
  htmlAttrs: string
  headTags: string
  body: string
  bodyAttrs: string
  dependencies: string[]
}

export interface RendererOptions {
  url: string;
  /* Client manifest. Required for preloading. */
  manifest?: Record<string, string[]>;
  /* Add preload link tags for JS and CSS assets */
  preload: boolean;
  request: Request;
  response: ServerResponse;
}

export interface Renderer<InitialState> {
  (
    options: RendererOptions,
    // writeResponse: (params: WriteResponse) => void,
    // isRedirect: () => boolean,
  ): Promise<Rendered<InitialState> | WriteResponse>
}
