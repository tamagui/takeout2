import { startTransition, useState } from 'react'

import { idle, type IdleOptions } from './idle'
import { useAsyncEffect } from './useAsyncEffect'

import type React from 'react'

export type LazyMountProps = IdleOptions

export const useLazyMount = (props: LazyMountProps = { max: 100 }): boolean => {
  const [mounted, setMounted] = useState(false)

  useAsyncEffect(
    async (signal) => {
      await idle(props, signal)
      startTransition(() => {
        setMounted(true)
      })
    },
    [
      // no need for deps it only ever mounts once
    ]
  )

  return mounted
}

export const LazyMount = ({
  children,
  ...idleProps
}: LazyMountProps & { children: any }): React.ReactNode => {
  const mounted = useLazyMount(idleProps)
  return mounted ? children : null
}
