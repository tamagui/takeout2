import { type Context, createContext } from 'react'

import { globalValue } from '../global/globalValue'

// create or retrieve a React context that is stored on `globalThis`.
// this ensures a stable singleton that survives hot-reloads during development.

export function createGlobalContext<T>(key: string, defaultValue: T): Context<T> {
  return globalValue(key, () => createContext<T>(defaultValue))
}
