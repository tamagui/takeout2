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
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      onLoadedData?.()
    }

    const handleError = (e: Event) => {
      onError?.(e)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
    }
  }, [onLoadedData, onError])

  return (
    <YStack width={width} height={height} {...stackProps}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        controls={controls}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        preload={preload}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
        }}
      />
    </YStack>
  )
}
