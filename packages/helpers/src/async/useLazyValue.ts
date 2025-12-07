import { startTransition, useState } from 'react'

import { idle, type IdleOptions } from './idle'
import { useAsyncEffect } from './useAsyncEffect'

export const useLazyValue = <T>(
  value: T,
  {
    immediateFirstUpdate,
    ...idleOptions
  }: IdleOptions & { immediateFirstUpdate?: boolean } = {}
): T => {
  const [lazyValue, setLazyValue] = useState(value)

  // first update to a real value immediate
  if (value && lazyValue === undefined && lazyValue !== value && immediateFirstUpdate) {
    setLazyValue(value)
  }

  useAsyncEffect(
    async (signal) => {
      await idle(idleOptions, signal)
      startTransition(() => {
        setLazyValue(value)
      })
    },
    [value]
  )

  return lazyValue
}
