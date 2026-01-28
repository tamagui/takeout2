import { useWindowDimensions } from 'tamagui'

import { Image } from '~/interface/image/Image'

interface PostImageProps {
  postId: string
  image: string
  caption?: string | null
  aspectRatio?: number
  onAspectRatioChange?: (ratio: number) => void
  sharedTransitionTag?: string
}

export function PostImage({ image }: PostImageProps) {
  const dim = useWindowDimensions()

  return <Image src={image} width={dim.width - 24} height={300} />
}
