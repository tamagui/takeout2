import { memo } from 'react'

export const PeopleIcon = memo(({ size = 28 }: { size?: number }) => {
  return (
    <svg
      style={{ transform: `translateX(1.5px)` }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      <circle cx="15" cy="6" r="3" fill="var(--color9)" opacity=".4" />
      <ellipse cx="16" cy="17" fill="var(--color9)" opacity=".4" rx="5" ry="3" />
      <circle cx="9.001" cy="6" r="4" fill="var(--color11)" />
      <ellipse cx="9.001" cy="17.001" fill="var(--color10)" rx="7" ry="4" />
    </svg>
  )
})
