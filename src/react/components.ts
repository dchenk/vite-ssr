import {
  createContext as reactCreateContext,
  createElement,
  Fragment,
  FunctionComponent,
  ReactElement,
  ReactNode,
  useContext as reactUseContext,
  useEffect,
  useState,
} from 'react'
import type { Context } from './types'

export const ClientOnly: FunctionComponent<{
  children: ReactNode
}> = ({ children }) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true))

  return mounted ? createElement(Fragment, { children }) : null
}

const SSR_CONTEXT = reactCreateContext(null as any)
export function provideContext(app: ReactElement, context: Context) {
  return createElement(SSR_CONTEXT.Provider, { value: context }, app)
}

export function useContext() {
  return reactUseContext(SSR_CONTEXT) as Context
}
