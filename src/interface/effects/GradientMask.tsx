import type React from 'react'
import { isWeb } from 'tamagui'

interface GradientMaskProps {
  children: React.ReactNode
  height?: string
  color?: string
  style?: React.CSSProperties
}

export const GradientMaskUp: React.FC<GradientMaskProps> = ({
  children,
  height = '50px',
  style = {},
}) => {
  if (!isWeb) {
    return children
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) calc(100% - ' +
            height +
            '), rgba(0,0,0,0) 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) calc(100% - ' +
            height +
            '), rgba(0,0,0,0) 100%)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export const GradientMaskDown: React.FC<GradientMaskProps> = ({
  children,
  height = '50px',
  style = {},
}) => {
  if (!isWeb) {
    return children
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          maskImage:
            'linear-gradient(to top, rgba(0,0,0,1) calc(100% - ' +
            height +
            '), rgba(0,0,0,0) 0%)',
          WebkitMaskImage:
            'linear-gradient(to top, rgba(0,0,0,1) calc(100% - ' +
            height +
            '), rgba(0,0,0,0) 0%)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export const GradientMaskUpDown: React.FC<
  GradientMaskProps & { bottomHeight?: string }
> = ({ children, height = '50px', bottomHeight, style = {} }) => {
  if (!isWeb) {
    return children
  }

  // Use bottomHeight if provided, otherwise fall back to height
  const bottomValue = bottomHeight || height

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ' +
            height +
            ', rgba(0,0,0,1) calc(100% - ' +
            bottomValue +
            '), rgba(0,0,0,0) 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ' +
            height +
            ', rgba(0,0,0,1) calc(100% - ' +
            bottomValue +
            '), rgba(0,0,0,0) 100%)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
