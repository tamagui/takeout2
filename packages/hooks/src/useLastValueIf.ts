import { useRef } from 'react'

export function useLastValueIf<T>(value: T, keepLast = true): T | undefined {
  // sorted [newest, older]
  const lastTwoValuesRef = useRef<(T | undefined)[]>([])

  const [latest] = lastTwoValuesRef.current
  if (keepLast) {
    if (latest !== value) {
      lastTwoValuesRef.current = [value, latest]
    }
  }

  return lastTwoValuesRef.current[1]
}
