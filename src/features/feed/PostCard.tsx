import { Dot } from '@tamagui/lucide-icons'
import { memo, useState } from 'react'
import { Accordion, SizableText, View, XStack, YStack } from 'tamagui'
import { userById } from '~/data/queries/user'
import type { Post } from '~/data/types'
import { useAuth } from '~/features/auth/client/authClient'
import { formatDistanceToNow } from '~/helpers/date/formatDate'
import { ButtonGlassCircle } from '~/interface/buttons/ButtonGlassCircle'
import { DotsThreeIcon } from '~/interface/icons/phosphor/DotsThreeIcon'
import { Image } from '~/interface/image/Image'
import { LinearGradientSeparator } from '~/interface/separators/LinearGradientSeparator'
import { showPostActionSheet } from '~/interface/sheet/postActionSheetHelper'
import { BodyText } from '~/interface/text/Body'
import { useQuery } from '~/zero/client'
import { AvatarWithMenu } from './AvatarWithMenu'
import { getMockUserById } from './mockData'

const USE_MOCK_DATA = process.env.NODE_ENV === 'development'

interface PostCardProps {
  post: Post
}

export const PostCard = memo(({ post }: PostCardProps) => {
  const { user } = useAuth()
  const authorId = post.userId
  const [author] = useQuery(
    userById,
    { userId: authorId },
    { enabled: !!authorId && !USE_MOCK_DATA }
  )

  const mockAuthor = USE_MOCK_DATA ? getMockUserById(authorId) : null
  const avatarUrl = USE_MOCK_DATA ? mockAuthor?.image : author?.image
  const username = USE_MOCK_DATA ? mockAuthor?.username : author?.username

  const [isTruncated, setIsTruncated] = useState<boolean>(false)

  const isOwnProfile = authorId === user?.id

  return (
    <YStack mt="$2">
      <XStack items="center" justify="space-between" pb="$2" px="$2">
        <XStack gap="$3">
          <AvatarWithMenu
            avatarUrl={avatarUrl || ''}
            userId={authorId}
            username={username || ''}
            isOwnProfile={isOwnProfile}
          />
          <YStack flex={1} gap="$2">
            <XStack items="center" justify="space-between">
              <XStack items="center">
                <SizableText size="$4" fontWeight="600" numberOfLines={1}>
                  {username}
                </SizableText>
                <Dot size={16} color="$color10" />

                <SizableText size="$3" color="$color10" ml="$2">
                  {formatDistanceToNow(post.createdAt)}
                </SizableText>
              </XStack>
              <ButtonGlassCircle
                size={32}
                onPress={() => {
                  showPostActionSheet(post, isOwnProfile)
                }}
              >
                <DotsThreeIcon size={16} color="$color12" />
              </ButtonGlassCircle>
            </XStack>
            <YStack>
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

            <View width="100%" position="relative" mt="$2">
              <Image
                src={post.image}
                width="100%"
                aspectRatio={3 / 4}
                objectFit="cover"
                rounded="$6"
              />
            </View>
          </YStack>
        </XStack>
      </XStack>

      <YStack py="$4">
        <LinearGradientSeparator />
      </YStack>
    </YStack>
  )
})
