import type React from 'react'

export const TakeoutGhostWeb: React.FC<{ size?: number }> = ({ size = 120 }) => {
  const scale = size / 100
  return (
    <svg
      width={100 * scale}
      height={120 * scale}
      viewBox="0 0 100 120"
      fill="none"
    >
      {/* wire handle arc */}
      <path
        d="M32,38 C32,14 68,14 68,38"
        stroke="#D4342B"
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* body trapezoid */}
      <polygon points="20,40 80,40 72,112 28,112" fill="#FAFAF7" />

      {/* left fold tab */}
      <polygon
        points="20,40 35,30 50,40"
        fill="#F0EFE9"
        stroke="#E5E4DE"
        strokeWidth="0.5"
      />

      {/* right fold tab */}
      <polygon
        points="50,40 65,30 80,40"
        fill="#ECEAE4"
        stroke="#E5E4DE"
        strokeWidth="0.5"
      />

      {/* fold crease */}
      <line
        x1="20"
        y1="40"
        x2="80"
        y2="40"
        stroke="#D8D7D1"
        strokeWidth="1"
      />

      {/* red accent stripes */}
      <rect
        x="35"
        y="65"
        width="30"
        height="4"
        rx="2"
        fill="#D4342B"
        opacity="0.5"
      />
      <rect
        x="38"
        y="74"
        width="24"
        height="3"
        rx="1.5"
        fill="#D4342B"
        opacity="0.3"
      />

      {/* subtle left shadow */}
      <polygon points="20,40 28,112 28,40" fill="#000" opacity="0.03" />
    </svg>
  )
}
