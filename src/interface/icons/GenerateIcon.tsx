import { memo } from 'react'

export const GenerateIcon = memo(({ size = 32 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="var(--color9)"
        fillRule="evenodd"
        d="M2 6.634a4.634 4.634 0 1 1 9.268 0a4.634 4.634 0 0 1-9.268 0"
        clipRule="evenodd"
        opacity=".5"
      />
      <path
        fill="var(--color9)"
        fillRule="evenodd"
        d="M12.732 17.366a4.634 4.634 0 1 1 9.269 0a4.634 4.634 0 0 1-9.269 0"
        clipRule="evenodd"
        opacity=".5"
      />
      <path
        fill="var(--color11)"
        d="M2 17.5c0-2.121 0-3.182.659-3.841S4.379 13 6.5 13s3.182 0 3.841.659S11 15.379 11 17.5s0 3.182-.659 3.841S8.621 22 6.5 22s-3.182 0-3.841-.659S2 19.621 2 17.5"
      />
      <path
        fill="var(--color11)"
        d="M13 6.5c0-2.121 0-3.182.659-3.841S15.379 2 17.5 2s3.182 0 3.841.659S22 4.379 22 6.5s0 3.182-.659 3.841S19.621 11 17.5 11s-3.182 0-3.841-.659S13 8.621 13 6.5"
      />
      <path
        fill="var(--color11)"
        d="M15.75 6.5a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75"
      />
      <path
        fill="var(--color11)"
        d="M17.5 8.75a.75.75 0 0 1-.75-.75V5.75a.75.75 0 0 1 1.5 0V8a.75.75 0 0 1-.75.75"
      />
    </svg>
  )
})
