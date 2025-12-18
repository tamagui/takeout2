import Animated, { SharedTransition } from 'react-native-reanimated'

const transition = SharedTransition.springify().damping(15)

interface PostImageProps {
  postId: string
  image: string
  caption?: string | null
  aspectRatio: number
  onAspectRatioChange: (ratio: number) => void
}

export function PostImage({ postId, image, aspectRatio }: PostImageProps) {
  return (
    <Animated.Image
      source={{ uri: image }}
      style={{
        width: '100%',
        aspectRatio,
        borderRadius: 12,
      }}
      sharedTransitionTag={`post-image-${postId}`}
      sharedTransitionStyle={transition}
      resizeMode="cover"
    />
  )
}
