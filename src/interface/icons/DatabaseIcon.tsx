import { memo } from 'react'

export const DatabaseIcon = memo(({ size = 28 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="var(--color11)"
        d="M12 10c4.418 0 8-1.79 8-4s-3.582-4-8-4s-8 1.79-8 4s3.582 4 8 4"
      />
      <path
        fill="var(--color10)"
        d="M4 6v6c0 2.21 3.582 4 8 4s8-1.79 8-4V6c0 2.21-3.582 4-8 4S4 8.21 4 6"
        opacity=".5"
      />
      <path
        fill="var(--color7)"
        d="M4 12v6c0 2.21 3.582 4 8 4s8-1.79 8-4v-6c0 2.21-3.582 4-8 4s-8-1.79-8-4"
        opacity=".5"
      />
    </svg>
  )
})
