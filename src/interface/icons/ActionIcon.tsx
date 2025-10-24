import { memo } from 'react'

export const ActionIcon = memo(({ size = 28 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="var(--color9)"
        d="M20.536 20.536C22 19.07 22 16.714 22 12s0-7.071-1.465-8.536C19.072 2 16.714 2 12 2S4.929 2 3.464 3.464C2 4.93 2 7.286 2 12s0 7.071 1.464 8.535C4.93 22 7.286 22 12 22s7.071 0 8.535-1.465"
        opacity=".5"
      />
      <path
        fill="var(--color11)"
        d="M13.8 7.2a1 1 0 0 1 .4 1.356l-4 8a1 1 0 1 1-1.793-.896l4-8a1 1 0 0 1 1.393-.46"
      />
    </svg>
  )
})
