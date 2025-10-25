import { Image } from '@tamagui/image-next'
import { useWindowDimensions, YStack } from 'tamagui'

interface ResponsiveImageProps {
  src: string
  originalWidth: number
  originalHeight: number
  designScreenWidth?: number
  designScreenHeight?: number
  maxWidthPercentage?: number
  maxHeightPercentage?: number
}

export const ResponsiveImage = ({
  src,
  originalWidth,
  originalHeight,
  designScreenWidth = 402,
  designScreenHeight = 874,
  maxWidthPercentage = 100,
  maxHeightPercentage = 100,
}: ResponsiveImageProps) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  // calculate the scale factor based on screen size vs design size
  const widthScale = screenWidth / designScreenWidth
  const heightScale = screenHeight / designScreenHeight

  // use the smaller scale to ensure image fits on screen
  const scale = Math.min(widthScale, heightScale)

  // calculate scaled dimensions
  let scaledWidth = originalWidth * scale
  let scaledHeight = originalHeight * scale

  return (
    <YStack width={scaledWidth} height={scaledHeight}>
      <Image src={src} width={scaledWidth} height={scaledHeight} objectFit="cover" />
    </YStack>
  )
}
