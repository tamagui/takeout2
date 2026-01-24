export function pickLast<T extends string | null | undefined>(
  a: T,
  b: T
): T extends string ? string : T {
  if (a == null && b == null) return undefined as any
  if (a == null) return b as any
  if (b == null) return a as any
  return (b.localeCompare(a) > 0 ? b : a) as any
}
