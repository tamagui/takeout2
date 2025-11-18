import { LinearGradient } from '@tamagui/linear-gradient'
import { useParams } from 'one'
import { memo, useState } from 'react'
import { ScrollView, SizableText, XStack, YStack, isWeb } from 'tamagui'
import { PostActionsPopover } from '~/features/feed/PostActionsPopover'
import { usePostById } from '~/features/feed/usePostById'
import { useUser } from '~/features/user/useUser'
import { formatDistanceToNow } from '~/helpers/date/formatDate'
import { Avatar } from '~/interface/avatars/Avatar'
import { Pressable } from '~/interface/buttons/Pressable'
import { GalleryImage, GalleryWrapper } from '~/interface/gallery/Gallery'
import { galleryEmitter } from '~/interface/gallery/galleryEmitter'
import { DotIcon } from '~/interface/icons/phosphor/DotIcon'
import { Image } from '~/interface/image/Image'
import { BodyText } from '~/interface/text/Body'

export const FeedDetailPage = memo(() => {
  const { feedId } = useParams()
  const { user } = useUser()
  const { post } = usePostById({ postId: feedId })
  const [aspectRatio, setAspectRatio] = useState<number>(1)
  const isOwnProfile = post?.userId === user?.id

  if (!post || !user) {
    return null
  }

  return (
    <>
      {/* Dark gradient background */}
      {!isWeb && (
        <LinearGradient
          colors={['#313131', 'transparent']}
          position="absolute"
          t={0}
          l={0}
          r={0}
          b={0}
          height={200}
        />
      )}

      <ScrollView
        flex={1}
        px="$3"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <XStack items="center" justify="space-between" py="$4">
          <XStack justify="space-between" gap="$3" width="100%">
            <XStack items="center" gap="$3" flex={1}>
              <Avatar image={user.image as string} size={32} />
              <XStack items="center" gap="$1">
                <SizableText size="$4" fontWeight="600" numberOfLines={1}>
                  {user.username}
                </SizableText>
                <DotIcon size={16} color="$color10" />
                <SizableText size="$3" color="$color10">
                  {formatDistanceToNow(post.createdAt)}
                </SizableText>
              </XStack>
            </XStack>
            <PostActionsPopover post={post} isOwnPost={isOwnProfile} />
          </XStack>
        </XStack>
        {isWeb ? (
          <Pressable
            onPress={() => {
              galleryEmitter.emit({
                items: [{ id: post.id.toString(), url: post.image }],
                firstItem: post.id.toString(),
              })
            }}
            mb="$4"
          >
            <Image
              key={`${post.id.toString()}`}
              src={post.image}
              width="100%"
              aspectRatio={1}
              objectFit="cover"
              rounded="$6"
            />
          </Pressable>
        ) : (
          <YStack mb="$4">
            <GalleryWrapper urls={[post.image]}>
              <GalleryImage>
                <Image
                  key={`${post.id.toString()}`}
                  src={post.image}
                  objectFit="cover"
                  rounded="$6"
                  width="100%"
                  aspectRatio={aspectRatio}
                  onLoad={(e) => {
                    const { naturalWidth, naturalHeight } = e.target as HTMLImageElement
                    if (naturalWidth && naturalHeight) {
                      setAspectRatio(naturalWidth / naturalHeight)
                    }
                  }}
                />
              </GalleryImage>
            </GalleryWrapper>
          </YStack>
        )}

        <YStack>
          <BodyText color="$color12">{post.caption}</BodyText>
        </YStack>
      </ScrollView>
    </>
  )
})
