// The associated index.js file is written by the plugin to redirect to either entry-client or entry-server.
import type { Component, ElementType, FunctionComponent, ReactNode } from 'react';
import type { Context, Renderer, RendererOptions, WriteResponse } from './utils/types';

export type { Context, WriteResponse } from './utils/types';

type PrepassVisitor = (
  element: ElementType<any>,
  instance?: Component<any, any>
) => void | Promise<any>;

export type Options<InitialState, EndStateServer> = {
  debug?: { mount?: boolean };
  setupStateSSR: (options: RendererOptions) => Promise<InitialState>;
  // Transform the initial state for serialization. Optionally include a WriteResponse object to change the way the
  // server responds (e.g., to redirect).
  transformStateSSR: (state: InitialState) => [EndStateServer, WriteResponse | undefined];
  transformStateClient: (state: EndStateServer) => InitialState;
  suspenseFallback?: ReactNode;
  prepassVisitor?: PrepassVisitor;
};

export declare function viteSSR<InitialState, EndStateServer = InitialState> (
  App: FunctionComponent<Context<InitialState>>,
  options: Options<InitialState, EndStateServer>,
): Renderer<InitialState> | void;
