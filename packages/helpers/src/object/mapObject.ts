export function mapObject<T extends Record<string, any>, R>(
  obj: T,
  fn: <K extends keyof T>(value: T[K], key: K) => R
): { [K in keyof T]: R } {
  const result = {} as { [K in keyof T]: R }

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      result[key] = fn(obj[key], key)
    }
  }

  return result
}
