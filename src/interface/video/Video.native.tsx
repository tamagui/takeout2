import { useEffect, useRef, type CSSProperties } from 'react'
import { YStack, type YStackProps } from 'tamagui'

export type VideoProps = {
  src: string
  poster?: string
  autoPlay?: boolean
  controls?: boolean
  loop?: boolean
  muted?: boolean
  playsInline?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  width?: number | string
  height?: number | string
  objectFit?: CSSProperties['objectFit']
  onLoadedData?: () => void
  onError?: (error: Event) => void
} & YStackProps

export const Video = ({
  src,
  poster,
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false,
  playsInline = true,
  preload = 'metadata',
  width = '100%',
  height = 'auto',
  objectFit = 'contain',
  onLoadedData,
  onError,
  ...stackProps
}: VideoProps) => {
  return (
    <YStack width={width} height={height} {...stackProps}>
      {/* Handle Video Player on native */}
    </YStack>
  )
}
