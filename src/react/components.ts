import {
  createContext as reactCreateContext,
  createElement,
  ReactElement,
  useContext as reactUseContext,
} from 'react';
import type { Context } from './types';

const SSR_CONTEXT = reactCreateContext(null as any)
export function provideContext(app: ReactElement, context: Context) {
  return createElement(SSR_CONTEXT.Provider, { value: context }, app)
}

export function useContext() {
  return reactUseContext(SSR_CONTEXT) as Context
}
