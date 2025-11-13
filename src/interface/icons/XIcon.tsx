import { memo } from 'react'

export const XIcon = memo(({ size, ...props }: any) => (
  <svg
    width={size || '44'}
    height={size || '44'}
    fillRule="evenodd"
    clipRule="evenodd"
    viewBox="0 0 512 509.64"
    {...props}
  >
    <path
      fill="var(--color12)"
      fillRule="nonzero"
      d="M323.74 148.35h36.12l-78.91 90.2 92.83 122.73h-72.69l-56.93-74.43-65.15 74.43h-36.14l84.4-96.47-89.05-116.46h74.53l51.46 68.04 59.53-68.04zm-12.68 191.31h20.02l-129.2-170.82H180.4l130.66 170.82z"
    />
  </svg>
))
