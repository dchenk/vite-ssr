import type { ReactNode } from 'react';
import type { Renderer, SharedContext, SharedOptions } from '../utils/types';

export interface Options extends SharedOptions {
  suspenseFallback?: ReactNode
  prepassVisitor?: any
}

export interface Hook {
  (params: SharedContext): Promise<void>
}

export interface ClientHandler {
  (App: any, options: Options, hook: Hook): Promise<void>
}

export interface SsrHandler {
  (App: any, options: Options, hook: Hook): Renderer
}
