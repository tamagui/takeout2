import { memo } from 'react'

export const HudSearchIcon = memo(({ size = 32 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="var(--color9)"
        d="M20.313 11.157a9.157 9.157 0 1 1-18.313 0a9.157 9.157 0 0 1 18.313 0"
        opacity=".5"
      />
      <path
        fill="var(--color11)"
        fillRule="evenodd"
        d="m21.003 21.003l-3.124-3.125a1.06 1.06 0 0 1 1.5-1.5l3.124 3.125a1.06 1.06 0 1 1-1.5 1.5"
        clipRule="evenodd"
      />
    </svg>
  )
})
