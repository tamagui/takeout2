import { createImage } from '@tamagui/image'
import { Image as ExpoImage } from 'expo-image'
import { styled } from 'tamagui'

const ExpoImageComponent = createImage({
  Component: ExpoImage,
  resizeModePropName: 'contentFit',
  objectPositionPropName: 'contentPosition',
})

export const Image = styled(ExpoImageComponent, {
  name: 'Image',
})
