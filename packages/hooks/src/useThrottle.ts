import { useRef } from 'react'

import { useEvent } from './useEvent'

type Timer = ReturnType<typeof setTimeout>

export const useThrottle = <T extends (...args: any[]) => any>(fn: T, delay = 100): T => {
  const lastCallTime = useRef<number>(0)
  const timeoutRef = useRef<Timer | null>(null)

  const stableFn = useEvent(fn)

  const throttledFn = useEvent((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime.current

    if (timeSinceLastCall >= delay) {
      // If enough time has passed, call immediately
      lastCallTime.current = now
      stableFn(...args)
    } else {
      // Otherwise, schedule a call for when the delay period is over
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        lastCallTime.current = Date.now()
        stableFn(...args)
        timeoutRef.current = null
      }, delay - timeSinceLastCall)
    }
  }) as T

  return throttledFn
}
