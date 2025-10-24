import { useRef, useEffect } from 'react'
import type { Input } from 'tamagui'

export const useFocusInputWhen = (condition: boolean) => {
  const inputRef = useRef<Input | null>(null)

  useEffect(() => {
    if (!condition) return
    inputRef.current?.focus()
  }, [condition])

  return inputRef
}
