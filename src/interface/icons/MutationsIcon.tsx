import { memo } from 'react'

export const MutationsIcon = memo(({ size = 32 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="var(--color9)"
        d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12"
        opacity=".5"
      />
      <path
        fill="var(--color11)"
        d="M15.75 9a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-2.19l-4.72 4.72a.75.75 0 1 1-1.06-1.06l4.72-4.72H16.5a.75.75 0 0 1-.75-.75"
      />
      <path
        fill="var(--color11)"
        fillRule="evenodd"
        d="M6.068 6.293a1 1 0 0 1 1.414 0L9.19 8H7a1 1 0 0 0 0 2h4a1 1 0 0 0 1-1V5a1 1 0 1 0-2 0v2.19L8.293 5.483a1 1 0 0 0-1.414 0l-.811.81a1 1 0 1 0 1.414 1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
})
