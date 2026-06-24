import { afterAll, vi } from 'vitest'

const isJsdomRuntime = typeof window !== 'undefined' && typeof document !== 'undefined'
const previousViteEnvironment = process.env.VITE_ENVIRONMENT

if (isJsdomRuntime) {
  process.env.VITE_ENVIRONMENT = 'client'
  vi.resetModules()
}

afterAll(() => {
  if (!isJsdomRuntime) return
  if (previousViteEnvironment === undefined) {
    delete process.env.VITE_ENVIRONMENT
  } else {
    process.env.VITE_ENVIRONMENT = previousViteEnvironment
  }
})

if (typeof globalThis.localStorage?.getItem !== 'function') {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return store.size
      },
      clear() {
        store.clear()
      },
      getItem(key: string) {
        return store.get(String(key)) ?? null
      },
      key(index: number) {
        return Array.from(store.keys())[index] ?? null
      },
      removeItem(key: string) {
        store.delete(String(key))
      },
      setItem(key: string, value: string) {
        store.set(String(key), String(value))
      },
    },
  })
}
