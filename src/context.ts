import { createContext as reactCreateContext, useContext as reactUseContext } from 'react';
import type { Context } from './utils/types';

const SSR_CONTEXT = reactCreateContext<Context<never>>(null as never);

export const ContextProvider = SSR_CONTEXT.Provider;

export const useContext = <T>(): Context<T> =>
  reactUseContext(SSR_CONTEXT);
