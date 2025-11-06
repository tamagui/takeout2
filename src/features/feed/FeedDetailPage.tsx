import { LinearGradient } from '@tamagui/linear-gradient'
import { Dot } from '@tamagui/lucide-icons'
import { useParams } from 'one'
import { memo } from 'react'
import { ScrollView, SizableText, XStack, YStack } from 'tamagui'
import { formatDistanceToNow } from '~/helpers/date/formatDate'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonGlassCircle } from '~/interface/buttons/ButtonGlassCircle'
import { Pressable } from '~/interface/buttons/Pressable'
import { galleryEmitter } from '~/interface/gallery/galleryEmitter'
import { DotsThreeIcon } from '~/interface/icons/phosphor/DotsThreeIcon'
import { Image } from '~/interface/image/Image'
import { showPostActionSheet } from '~/interface/sheet/postActionSheetHelper'
import { BodyText } from '~/interface/text/Body'
import { useUser } from '../user/useUser'
import { usePostById } from './usePostById'

export const FeedDetailPage = memo(() => {
  const { feedId } = useParams()
  const { user } = useUser()
  const { post } = usePostById({ postId: feedId })
  const isOwnProfile = post?.userId === user?.id

  if (!post || !user) {
    return null
  }

  return (
    <>
      {/* Dark gradient background */}
      <LinearGradient
        colors={['#313131', 'transparent']}
        position="absolute"
        t={0}
        l={0}
        r={0}
        b={0}
        height={200}
      />

      <ScrollView
        flex={1}
        px="$3"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <XStack items="center" justify="space-between" py="$4">
          <XStack justify="space-between" gap="$3">
            <XStack items="center" gap="$3" flex={1}>
              <Avatar image={user.image as string} size={32} />
              <XStack items="center" gap="$1">
                <SizableText size="$4" fontWeight="600" numberOfLines={1}>
                  {user.username}
                </SizableText>
                <Dot size={16} color="$color10" />
                <SizableText size="$3" color="$color10">
                  {formatDistanceToNow(post.createdAt)}
                </SizableText>
              </XStack>
            </XStack>
            <ButtonGlassCircle
              size={32}
              onPress={() =>
                showPostActionSheet(post, isOwnProfile, {
                  shouldNavigateBackOnDelete: true,
                })
              }
            >
              <DotsThreeIcon size={16} color="$color12" />
            </ButtonGlassCircle>
          </XStack>
        </XStack>
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

        <YStack>
          <BodyText color="$color12">{post.caption}</BodyText>
        </YStack>
      </ScrollView>
    </>
  )
})
