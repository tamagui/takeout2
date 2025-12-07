import { isEqualDeepLite } from '@take-out/helpers'
import { useEffect, useMemo, useRef } from 'react'

/**
 * When zero mutates and inserts, it creates all new objects for everything, but this
 * breaks react memoization, even when only the last item is mutated, or the last item
 * is inserted. This hook should be considered temporary, I've brought up the idea with
 * the zero team to implement this internally, as that would be significantly faster.
 *
 * for now, this basically will re-use the last message if JSON.stringify says its the same
 * that way you skip a lot of re-rendering work when changing long lists of items
 *
 * NOTE: this leaks memory
 */
export function useMemoizedObjectList<
  Items extends readonly object[],
  Item extends Items[0] = Items[0],
  ItemKey extends keyof Item = keyof Item,
>(list: Items, identityKey: ItemKey): Items {
  const memoizedItems = useRef<Record<string, any>>({})
  const memoizedList = useRef<Items>(list)

  const val = useMemo(() => {
    let res = list
    let didFindChange = false
    const next: Item[] = []
    const lastItems = memoizedItems.current

    // changed size, always update array identity
    if (list.length !== memoizedList.current.length) {
      didFindChange = true
    }

    for (const item_ of list) {
      const item = item_ as Item
      const id = item[identityKey] as any
      const last = lastItems[id]

      // zero is returning a symbol on objects sometimes?
      if (!last || !isEqualDeepLite(last, item)) {
        didFindChange = true

        // if (last) {
        //   console.info(`did change`, item, 'vs', last)
        //   for (const key in item) {
        //     if (!deepEqualLite(item[key], last[key])) {
        //       console.warn('changed', key)
        //     }
        //   }
        // }

        lastItems[id] = item
        next.push(item)
      } else {
        next.push(last)
      }
    }

    // if every item matches we can memoize the entire array
    if (didFindChange) {
      res = next as any
    } else {
      res = memoizedList.current
    }

    return res
  }, [identityKey, list])

  useEffect(() => {
    memoizedList.current = val
  }, [val])

  return val
}
