import {
  createContext as reactCreateContext,
  createElement,
  ReactElement,
  useContext as reactUseContext,
} from 'react';
import type { Context } from './types';

const SSR_CONTEXT = reactCreateContext<Context>(null as never);

export function provideContext(app: ReactElement, context: Context) {
  return createElement(SSR_CONTEXT.Provider, { value: context }, app)
}

export const useContext = (): Context =>
  reactUseContext(SSR_CONTEXT);
