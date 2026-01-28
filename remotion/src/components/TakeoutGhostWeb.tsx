import type React from 'react'

export const TakeoutGhostWeb: React.FC<{ size?: number }> = ({ size = 120 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 120 140" fill="none">
      {/* box body - front face */}
      <polygon points="25,50 95,50 85,130 35,130" fill="#FFFFFF" opacity="0.9" />
      {/* box body - right face */}
      <polygon points="95,50 108,40 98,120 85,130" fill="#E8E8E8" opacity="0.85" />
      {/* box body - left face */}
      <polygon points="25,50 12,40 22,120 35,130" fill="#D0D0D0" opacity="0.8" />
      {/* lid - top face */}
      <polygon points="12,40 60,22 108,40 60,50" fill="#F5F5F5" opacity="0.95" />
      {/* lid flap left */}
      <polygon points="25,50 60,50 60,42 12,40" fill="#EEEEEE" opacity="0.9" />
      {/* lid flap right */}
      <polygon points="95,50 60,50 60,42 108,40" fill="#E0E0E0" opacity="0.9" />
      {/* wire handle */}
      <path
        d="M42,38 Q60,14 78,38"
        stroke="#CC342D"
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* red accent stripe */}
      <rect x="42" y="72" width="36" height="5" rx="2" fill="#CC342D" opacity="0.7" />
      {/* red accent stripe 2 */}
      <rect x="42" y="82" width="24" height="3" rx="1.5" fill="#CC342D" opacity="0.4" />
      {/* subtle edge highlight */}
      <line x1="25" y1="50" x2="95" y2="50" stroke="#FFFFFF" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}
