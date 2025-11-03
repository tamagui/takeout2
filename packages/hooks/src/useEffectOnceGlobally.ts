import { useEffect } from 'react'

const executedKeys = new Set<string>()

type WithId = { id: string }

type KeyType<T> = string | string[] | WithId | WithId[] | readonly WithId[] | undefined

/**
 * Hook that ensures an effect only runs once globally across all component instances
 * Uses a key (or array of keys) to determine if the effect has already been executed
 */
export function useEffectOnceGlobally<T extends KeyType<T>>(
  key: T,
  callback: T extends undefined ? () => void : (value: NonNullable<T>) => void
) {
  const keyString = !key
    ? undefined
    : typeof key === 'string'
      ? key
      : Array.isArray(key)
        ? typeof key[0] === 'string'
          ? (key as string[]).sort().join('')
          : (key as readonly WithId[])
              .map((item) => item.id)
              .sort()
              .join('')
        : (key as WithId).id

  useEffect(() => {
    if (!keyString || executedKeys.has(keyString)) {
      return
    }
    executedKeys.add(keyString)
    if (key !== undefined) {
      ;(callback as (value: NonNullable<T>) => void)(key as NonNullable<T>)
    } else {
      ;(callback as () => void)()
    }
  }, [keyString, callback, key])
}
