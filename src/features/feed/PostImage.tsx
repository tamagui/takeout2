import { Image } from '~/interface/image/Image'

interface PostImageProps {
  postId: string
  image: string
  caption?: string | null
  aspectRatio?: number
  onAspectRatioChange?: (ratio: number) => void
  sharedTransitionTag?: string
}

export function PostImage({
  image,
  caption,
  aspectRatio = 1,
  onAspectRatioChange,
}: PostImageProps) {
  return (
    <Image
      src={image}
      alt={caption || 'Post image'}
      width="100%"
      objectFit="cover"
      rounded="$6"
      aspectRatio={aspectRatio}
      onLoad={
        onAspectRatioChange
          ? (e) => {
              const { naturalWidth, naturalHeight } = e.target as HTMLImageElement
              if (naturalWidth && naturalHeight) {
                onAspectRatioChange(naturalWidth / naturalHeight)
              }
            }
          : undefined
      }
    />
  )
}
