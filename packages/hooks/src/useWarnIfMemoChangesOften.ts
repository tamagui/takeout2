import { useEffect, useRef } from 'react'
import { emptyFn } from '@tamatko/helpers'

export const useWarnIfMemoChangesOften =
  process.env.NODE_ENV === 'production'
    ? (emptyFn as never)
    : <T>(value: T, threshold = 5, name?: string) => {
        const countRef = useRef(0)
        const prevValueRef = useRef<T>(value)

        useEffect(() => {
          if (prevValueRef.current !== value) {
            countRef.current++
            prevValueRef.current = value

            if (countRef.current > threshold) {
              const warningName = name || 'Memoized value'
              console.warn(
                `🔄 ${warningName} is changing too often! Changed ${countRef.current} times (threshold: ${threshold})`
              )
            }
          }
        }, [value, threshold, name])
      }
