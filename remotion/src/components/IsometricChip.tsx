import type React from 'react'

interface IsometricChipProps {
  children: React.ReactNode
  label?: string
  width?: number
  height?: number
  depth?: number
  edgeColor?: string
  borderColor?: string
  liftY?: number
}

export const IsometricChip: React.FC<IsometricChipProps> = ({
  children,
  label,
  width = 120,
  height = 120,
  depth = 14,
  edgeColor = '#111111',
  borderColor = '#1e1e1e',
  liftY = 0,
}) => {
  const radius = 18

  return (
    <div
      style={{
        position: 'relative',
        width: width + depth,
        height: height + depth,
        transform: `translateY(${-liftY}px)`,
      }}
    >
      {/* right depth edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: width,
          width: depth,
          height: height + depth,
          clipPath: `polygon(0px 0px, ${depth}px ${depth}px, ${depth}px ${height + depth}px, 0px ${height}px)`,
          backgroundColor: edgeColor,
          borderRadius: `0 ${radius}px ${radius}px 0`,
        }}
      />

      {/* bottom depth edge */}
      <div
        style={{
          position: 'absolute',
          top: height,
          left: 0,
          width: width + depth,
          height: depth,
          clipPath: `polygon(0px 0px, ${width}px 0px, ${width + depth}px ${depth}px, ${depth}px ${depth}px)`,
          backgroundColor: edgeColor === '#111111' ? '#0d0d0d' : edgeColor,
          borderRadius: `0 0 ${radius}px ${radius}px`,
        }}
      />

      {/* top face */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          borderRadius: radius,
          backgroundColor: '#141414',
          border: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          zIndex: 2,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {children}
        {label && (
          <span
            style={{
              color: '#555',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.5,
              fontFamily: "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif",
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
