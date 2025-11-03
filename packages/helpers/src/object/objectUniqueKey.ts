const w = new WeakMap<any, string>()

export const objectUniqueKey = (item: any): string => {
  return (
    w.get(item) ??
    (() => {
      const k = `${Math.random()}`
      w.set(item, k)
      return k
    })()
  )
}
