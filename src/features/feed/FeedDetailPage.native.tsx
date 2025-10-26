import { Galeria } from '@nandorojo/galeria'
import { Image } from 'expo-image'
import { useParams } from 'one'
import { memo, useState } from 'react'
import { ScrollView, SizableText, Spacer, XStack, YStack } from 'tamagui'
import { useAuth } from '~/auth/client/authClient'
import { formatDistanceToNow } from '~/helpers/date/formatDate'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { BasicHeader } from '~/interface/headers/BasicHeader'
import { DotsThreeIcon } from '~/interface/icons/phosphor/DotsThreeIcon'
import { HeartIcon } from '~/interface/icons/phosphor/HeartIcon'
import { showPostActionSheet } from '~/interface/sheet/postActionSheetHelper'
import { BodyText } from '~/interface/text/Body'
import { useUserStats } from '../user/useUserStats'
import { InteractButton } from './InteractButton'
import { useLike } from './useLike'
import { usePostById } from './usePostById'

export const FeedDetailPage = memo(() => {
  const { feedId } = useParams()
  const { user } = useAuth()
  const { post } = usePostById({ postId: feedId })
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1)
  const { hasLiked, toggleLike } = useLike(user?.id, post?.id, post?.userId)
  const isOwnProfile = post?.userId === user?.id

  if (!post || !user) {
    return null
  }

  return (
    <YStack flex={1}>
      <BasicHeader title="Post" />

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <XStack items="center" justify="space-between" pb="$2" px="$3">
          <XStack items="center" gap="$3">
            <Avatar image={user.image as string} size={32} />
            <YStack flex={1}>
              <XStack items="center" gap="$2">
                <SizableText size="$4" fontWeight="600">
                  {user.name}
                </SizableText>
                <Spacer flex />
              </XStack>
            </YStack>
          </XStack>
        </XStack>
        <Galeria urls={[post.image]}>
          <Galeria.Image>
            <Image
              key={`${post.id.toString()}`}
              source={post.image}
              style={{
                width: '100%',
                aspectRatio: 3 / 4,
              }}
              contentFit="cover"
              transition={500}
              // onLoad={(event) => {
              //   const { width, height } = event.source
              //   if (width && height) {
              //     setImageAspectRatio(width / height)
              //   }
              // }}
            />
          </Galeria.Image>
        </Galeria>
        {/* Stats */}
        <XStack px="$3" items="center" gap="$3" py="$2.5" justify="space-between">
          <XStack gap="$3">
            <InteractButton
              icon={HeartIcon}
              count={post.likesCount}
              onPress={toggleLike}
              active={hasLiked}
            />
          </XStack>
          <XStack gap="$2">
            <ButtonSimple
              circular
              variant="outlined"
              icon={<DotsThreeIcon size={16} color="$color12" />}
              onPress={() =>
                showPostActionSheet(post, isOwnProfile, {
                  shouldNavigateBackOnDelete: true,
                })
              }
            />
          </XStack>
        </XStack>
        {/* Caption */}
        <XStack justify="space-between" flex={1} px="$3">
          <YStack flex={1}>
            <BodyText color="$color12">{post.caption}</BodyText>
          </YStack>
          <SizableText size="$2" color="$color10">
            {formatDistanceToNow(post.createdAt)}
          </SizableText>
        </XStack>
      </ScrollView>
    </YStack>
  )
})
