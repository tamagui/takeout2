import { memo } from 'react'

import { Image } from '~/interface/image/Image'

interface PostImageProps {
  postId?: string
  image: string
  caption?: string | null
  aspectRatio?: number
  onAspectRatioChange?: (ratio: number) => void
  sharedTransitionTag?: string
  fill?: boolean
}

export const PostImage = memo(
  ({ image, caption, aspectRatio = 1, onAspectRatioChange, fill }: PostImageProps) => {
    return (
      <Image
        src={image}
        alt={caption || 'Post image'}
        width="100%"
        height={fill ? '100%' : undefined}
        objectFit="cover"
        rounded={fill ? 0 : '$6'}
        aspectRatio={fill ? undefined : aspectRatio}
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
)
