/**
 * Returns a new array with duplicate elements removed based on a key selector function.
 * @param array The input array to remove duplicates from
 * @param keyFn Function that returns the key to compare elements by
 * @returns A new array with duplicates removed
 */

export function uniqBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
  const seen = new Map<K, T>()

  for (const item of array) {
    const key = keyFn(item)
    if (!seen.has(key)) {
      seen.set(key, item)
    }
  }

  return Array.from(seen.values())
}
