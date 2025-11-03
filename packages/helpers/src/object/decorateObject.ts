export function decorateObject<T extends Record<string, any>>(
  obj: T,
  decorator: (fn: Function) => Function
): T {
  const decorated = {} as T

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'function') {
      ;(decorated as any)[key] = decorator(value)
    } else {
      ;(decorated as any)[key] = value
    }
  }

  return decorated
}
