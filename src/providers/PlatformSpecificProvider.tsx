import type { ReactNode } from 'react'

export function PlatformSpecificProvider(props: { children: ReactNode }) {
  return <>{props.children}</>
}
