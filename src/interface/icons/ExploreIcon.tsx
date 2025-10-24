import { memo } from 'react'

export const ExploreIcon = memo(({ size = 32 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="var(--color9)" opacity=".5" />
      <path
        fill="var(--color11)"
        fillRule="evenodd"
        d="M7.29 7.29a.75.75 0 0 1 1.024-.032l.058.053l5.834 5.833a.75.75 0 0 1 .032 1.024l-.053.058l-5.833 5.834a.75.75 0 0 1-1.115-1.003l.053-.058L12.439 14l-5.15-5.15a.75.75 0 0 1-.031-1.024z"
        clipRule="evenodd"
      />
      <path
        fill="var(--color11)"
        d="m15.207 9.293l-4-4a1 1 0 0 1 1.415-1.414l4 4a1 1 0 0 1-1.415 1.414"
      />
    </svg>
  )
})
