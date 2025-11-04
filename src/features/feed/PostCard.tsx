import { Image } from '~/interface/image/Image'
import { memo, useState } from 'react'
import { Accordion, SizableText, View, XStack, YStack } from 'tamagui'
import { userById } from '~/data/queries/user'
import type { Post } from '~/data/types'
import { formatDistanceToNow } from '~/helpers/date/formatDate'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { DotsThreeIcon } from '~/interface/icons/phosphor/DotsThreeIcon'
import { LinearGradientSeparator } from '~/interface/separators/LinearGradientSeparator'
import { showPostActionSheet } from '~/interface/sheet/postActionSheetHelper'
import { BodyText } from '~/interface/text/Body'
import { useQuery } from '~/zero/client'
import { useAuth } from '~/features/auth/client/authClient'
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
    <YStack>
      <XStack items="center" justify="space-between" pb="$2" px="$3">
        <XStack items="center" gap="$3">
          <AvatarWithMenu
            avatarUrl={avatarUrl || ''}
            userId={authorId}
            username={username || ''}
            isOwnProfile={isOwnProfile}
          />
          <YStack flex={1}>
            <XStack items="center" gap="$2">
              <SizableText size="$4" fontWeight="600">
                {username}
              </SizableText>
            </XStack>
          </YStack>
        </XStack>
      </XStack>

      <View width="100%" position="relative">
        <Image
          src={post.image}
          style={{ width: '100%', aspectRatio: 3 / 4 }}
          objectFit="cover"
        />
      </View>

      <XStack px="$3" items="center" gap="$3" py="$2.5" justify="flex-end">
        <ButtonSimple
          circular
          variant="outlined"
          icon={<DotsThreeIcon size={16} color="$color12" />}
          onPress={() => showPostActionSheet(post, isOwnProfile)}
        />
      </XStack>

      <XStack justify="space-between" flex={1} px="$3" gap="$1">
        <YStack flex={1}>
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
        </YStack>
        <SizableText size="$2" color="$color10">
          {formatDistanceToNow(post.createdAt)}
        </SizableText>
      </XStack>

      <YStack py="$6">
        <LinearGradientSeparator />
      </YStack>
    </YStack>
  )
})
