import { Dot } from '@tamagui/lucide-icons'
import { router } from 'one'
import { memo, useState } from 'react'
import { Accordion, SizableText, View, XStack, YStack } from 'tamagui'
import { userById } from '~/data/queries/user'
import type { Post } from '~/data/types'
import { useAuth } from '~/features/auth/client/authClient'
import { formatDistanceToNow } from '~/helpers/date/formatDate'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Pressable } from '~/interface/buttons/Pressable'
import { DotsThreeIcon } from '~/interface/icons/phosphor/DotsThreeIcon'
import { Image } from '~/interface/image/Image'
import { LinearGradientSeparator } from '~/interface/separators/LinearGradientSeparator'
import { showPostActionSheet } from '~/interface/sheet/postActionSheetHelper'
import { BodyText } from '~/interface/text/Body'
import { useQuery } from '~/zero/client'
import { AvatarWithMenu } from './AvatarWithMenu'

interface PostCardProps {
  post: Post
}

export const PostCard = memo(({ post }: PostCardProps) => {
  const { user } = useAuth()
  const authorId = post.userId
  const [author] = useQuery(userById, { userId: authorId }, { enabled: !!authorId })
  const avatarUrl = author?.image
  const username = author?.username

  const [isTruncated, setIsTruncated] = useState<boolean>(false)

  const isOwnProfile = authorId === user?.id

  return (
    <View mt="$2">
      <View px="$4">
        <XStack items="center" justify="space-between" pb="$2">
          <XStack gap="$3">
            <AvatarWithMenu
              avatarUrl={avatarUrl || ''}
              userId={authorId}
              username={username || ''}
              isOwnProfile={isOwnProfile}
            />
            <YStack flex={1} gap="$2">
              <XStack items="center" justify="space-between">
                <XStack items="center" gap="$1">
                  <SizableText size="$4" fontWeight="600" numberOfLines={1}>
                    {username}
                  </SizableText>
                  <Dot size={16} color="$color10" />
                  <SizableText size="$3" color="$color10">
                    {formatDistanceToNow(post.createdAt)}
                  </SizableText>
                </XStack>
                <ButtonSimple
                  size="small"
                  circular
                  glass
                  onPress={() => {
                    showPostActionSheet(post, isOwnProfile)
                  }}
                >
                  <DotsThreeIcon size={16} color="$color12" />
                </ButtonSimple>
              </XStack>
            </YStack>
          </XStack>
        </XStack>
        <Pressable
          onPress={() => router.push(`/home/post/${post.id}?username=${username}`)}
        >
          <Accordion overflow="hidden" type="multiple">
            <Accordion.Item value="caption">
              <Accordion.Trigger unstyled disabled={!isTruncated}>
                {({ open }: { open: boolean }) => (
                  <BodyText
                    color="$color12"
                    numberOfLines={open ? undefined : 3}
                    flex={1}
                    onTextLayout={(e) => {
                      if (e.nativeEvent.lines.length >= 3) {
                        setIsTruncated(true)
                      }
                    }}
                  >
                    {post.caption}
                  </BodyText>
                )}
              </Accordion.Trigger>
              <Accordion.HeightAnimator animation="200ms">
                <Accordion.Content animation="200ms" exitStyle={{ opacity: 0 }} />
              </Accordion.HeightAnimator>
            </Accordion.Item>
          </Accordion>
          <View width="100%" position="relative" mt="$2">
            <Image
              src={post.image}
              width="100%"
              aspectRatio={1}
              objectFit="cover"
              rounded="$6"
            />
          </View>
        </Pressable>
      </View>

      <YStack py="$4">
        <LinearGradientSeparator />
      </YStack>
    </View>
  )
})
