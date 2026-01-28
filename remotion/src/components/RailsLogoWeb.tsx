import type React from 'react'

export const RailsLogoWeb: React.FC<{ size?: number }> = ({ size = 120 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <polygon points="60,8 108,38 96,112 24,112 12,38" fill="#CC342D" />
      <polygon points="60,8 60,112 96,112 108,38" fill="#A12722" />
      <polygon points="60,8 36,58 60,112" fill="#FFFFFF" opacity="0.15" />
      <polygon points="60,8 84,58 60,112" fill="#000000" opacity="0.08" />
    </svg>
  )
}
