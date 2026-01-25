// import { Galeria } from '@nandorojo/galeria'
import Animated, { SharedTransition } from 'react-native-reanimated'
import { useWindowDimensions } from 'tamagui'

import { Gallery } from '~/interface/gallery/Gallery'
import { Image } from '~/interface/image/Image'

const transition = SharedTransition.springify().damping(15)

interface PostImageProps {
  postId: string
  image: string
  caption?: string | null
  aspectRatio?: number
  onAspectRatioChange?: (ratio: number) => void
  sharedTransitionTag?: string
}

export function PostImage({
  postId,
  image,
  aspectRatio = 1,
  sharedTransitionTag,
}: PostImageProps) {
  const dim = useWindowDimensions()

  return <Image key="wtf" src={image} width={dim.width - 24} height={300} />

  // return (
  //   <Galeria urls={[image]}>
  //     <Galeria.Image index={0}>
  //       <Animated.Image
  //         source={{ uri: image }}
  //         style={{
  //           width: '100%',
  //           aspectRatio,
  //           borderRadius: 12,
  //         }}
  //         sharedTransitionTag={sharedTransitionTag ?? `post-image-${postId}`}
  //         sharedTransitionStyle={transition}
  //         resizeMode="cover"
  //       />
  //     </Galeria.Image>
  //   </Galeria>
  // )
}
