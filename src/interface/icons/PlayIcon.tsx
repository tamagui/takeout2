import { memo } from 'react'

export const PlayIcon = memo(({ size = 28 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="var(--color10)"
        d="M21.409 9.353a2.998 2.998 0 0 1 0 5.294L8.597 21.614C6.534 22.737 4 21.277 4 18.968V5.033c0-2.31 2.534-3.769 4.597-2.648z"
      />
    </svg>
  )
})
