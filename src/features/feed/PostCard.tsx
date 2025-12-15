import { router } from 'one'
import { memo, useState } from 'react'
import { Accordion, isWeb, SizableText, View, XStack, YStack } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { formatDistanceToNow } from '~/helpers/date/formatDate'
import { useUser } from '~/hooks/useUser'
import { Pressable } from '~/interface/buttons/Pressable'
import { DotIcon } from '~/interface/icons/phosphor/DotIcon'
import { Image } from '~/interface/image/Image'
import { LinearGradientSeparator } from '~/interface/separators/LinearGradientSeparator'
import { Text } from '~/interface/text/Text'

import { AvatarWithMenu } from './AvatarWithMenu'
import { PostActionsPopover } from './PostActionsPopover'

import type { Post } from '~/data/types'

interface PostCardProps {
  post: Post
}

export const PostCard = memo(({ post }: PostCardProps) => {
  const { user } = useAuth()
  const authorId = post.userId
  const [author] = useUser(authorId)
  const avatarUrl = author?.image
  const username = author?.username

  const [isTruncated, setIsTruncated] = useState<boolean>(false)
  const [aspectRatio, setAspectRatio] = useState<number>(1)
  const isOwnProfile = authorId === user?.id

  return (
    <View
      mt="$2"
      data-testid={`post-card-${post.id}`}
      {...(isWeb && { bg: '$background', rounded: '$6', py: '$4' })}
    >
      <View px="$4">
        <XStack items="center" justify="space-between" pb="$2">
          <XStack gap="$3" width="100%">
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
                  <DotIcon size={16} color="$color10" />
                  <SizableText size="$3" color="$color10">
                    {formatDistanceToNow(post.createdAt)}
                  </SizableText>
                </XStack>
                <PostActionsPopover post={post} isOwnPost={isOwnProfile} />
              </XStack>
            </YStack>
          </XStack>
        </XStack>
        <Pressable
          onPress={() => router.push(`/home/post/${post.id}?username=${username}`)}
        >
          <Accordion overflow="hidden" type="multiple">
            <Accordion.Item value="caption" bg="transparent" borderWidth={0} p={0}>
              <Accordion.Trigger
                unstyled
                disabled={!isTruncated}
                p={0}
                bg="transparent"
                borderWidth={0}
              >
                {({ open }: { open: boolean }) => (
                  <Text
                    numberOfLines={open ? undefined : 3}
                    flex={1}
                    text="left"
                    {...(!isWeb && {
                      onTextLayout: (e: { nativeEvent: { lines: unknown[] } }) => {
                        if (e.nativeEvent.lines.length >= 3) {
                          setIsTruncated(true)
                        }
                      },
                    })}
                  >
                    {post.caption}
                  </Text>
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
              alt={post.caption || 'Post image'}
              width="100%"
              objectFit="cover"
              rounded="$6"
              aspectRatio={aspectRatio}
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.target as HTMLImageElement
                if (naturalWidth && naturalHeight) {
                  setAspectRatio(naturalWidth / naturalHeight)
                }
              }}
            />
          </View>
        </Pressable>
      </View>

      {!isWeb && (
        <YStack py="$4">
          <LinearGradientSeparator />
        </YStack>
      )}
    </View>
  )
})
