import { debounce } from '@take-out/helpers'
import { useCallback, useEffect, useMemo, useState } from 'react'

export function useDebouncePrepend<T extends readonly { id: any }[]>(
  list: T,
  delay: number
): T {
  const [current, setCurrent] = useState(list)
  const [previous, setPrevious] = useState(list)
  const [pendingUpdate, setPendingUpdate] = useState<T | null>(null)

  const debouncedUpdate = useMemo(() => {
    return debounce((newList: T) => {
      setCurrent(newList)
      setPendingUpdate(null)
    }, delay)
  }, [delay])

  const updateState = useCallback(
    (newList: T) => {
      setCurrent((prevCurrent) => {
        // If there's a pending update, use the most recent list
        const currentList = pendingUpdate || prevCurrent

        // Check if we're prepending by comparing with the actual previous state
        const isPrepending =
          newList.length > previous.length && newList[0]?.id !== previous[0]?.id

        if (isPrepending) {
          // Cancel any existing debounced update
          debouncedUpdate.cancel()
          setPendingUpdate(newList)
          debouncedUpdate(newList)
          return currentList // Keep current state until debounced update fires
        }

        // Immediate update for non-prepending changes
        debouncedUpdate.cancel()
        setPendingUpdate(null)
        return newList
      })
    },
    [previous, pendingUpdate, debouncedUpdate]
  )

  useEffect(() => {
    if (list === previous) {
      return
    }

    // Update previous state
    setPrevious(list)

    // Update current state with concurrent safety
    updateState(list)

    return () => {
      debouncedUpdate.cancel()
    }
  }, [list, previous, updateState, debouncedUpdate])

  return current
}
