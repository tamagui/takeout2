export function globalEffect(key: string, factory: () => void | (() => void)): void {
  const disposeKey = Symbol.for(key)
  const g = globalThis as Record<symbol, () => void>

  if (g[disposeKey]) {
    g[disposeKey]?.()
  }

  const dispose = factory()

  if (dispose) {
    g[disposeKey] = dispose
  }
}
