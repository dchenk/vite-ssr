import { createContext as reactCreateContext, useContext as reactUseContext } from 'react';
import type { SharedContext } from './utils/types';

export type Context = SharedContext;

const SSR_CONTEXT = reactCreateContext<SharedContext>(null as never);

export const ContextProvider = SSR_CONTEXT.Provider;

export const useContext = (): SharedContext =>
  reactUseContext(SSR_CONTEXT);
