import { formatDistanceToNow } from '@take-out/helpers'
import { router } from 'one'
import { memo, useState } from 'react'
import { isWeb, SizableText, View, XStack, YStack } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { Link } from '~/interface/app/Link'
import { Avatar } from '~/interface/avatars/Avatar'
import { Button } from '~/interface/buttons/Button'
import { Pressable } from '~/interface/buttons/Pressable'
import { ChatCircleIcon } from '~/interface/icons/phosphor/ChatCircleIcon'
import { DotIcon } from '~/interface/icons/phosphor/DotIcon'
import { Text } from '~/interface/text/Text'

import { PostActionMenu } from './PostActionMenu'
import { PostCommentPreview } from './PostCommentPreview'
import { PostImage } from './PostImage'

import type { PostWithLatestComment } from '~/data/types'

interface PostCardProps {
  post: PostWithLatestComment
}

export const PostCard = memo(({ post }: PostCardProps) => {
  const { user } = useAuth()
  const authorId = post.userId
  // user is loaded with the post query, no N+1
  const avatarUrl = post.user?.image
  const username = post.user?.username

  const [, setIsTruncated] = useState<boolean>(false)
  const storedAspectRatio =
    post.imageWidth && post.imageHeight ? post.imageWidth / post.imageHeight : undefined
  const [aspectRatio, setAspectRatio] = useState<number>(storedAspectRatio ?? 1.5)
  const isOwnProfile = authorId === user?.id

  return (
    <View
      mt="$2"
      pb="$4"
      data-testid={`post-card-${post.id}`}
      $platform-web={{
        rounded: '$6',
        py: '$4',
        maxW: 600,
        mx: 'auto',
        width: '100%',
      }}
    >
      <View px="$4">
        <XStack items="center" justify="space-between" pb="$2">
          <XStack gap="$3" width="100%">
            <Link
              href={isOwnProfile ? '/home/profile' : `/home/feed/profile/${authorId}`}
            >
              <Avatar image={avatarUrl || ''} name={username || ''} size={32} gradient />
            </Link>
            <YStack flex={1} gap="$2">
              <XStack items="center" justify="space-between">
                <XStack items="center" gap="$1">
                  <Link
                    href={
                      isOwnProfile ? '/home/profile' : `/home/feed/profile/${authorId}`
                    }
                  >
                    <SizableText
                      size="$4"
                      fontWeight="600"
                      numberOfLines={1}
                      hoverStyle={{ color: '$color12' }}
                    >
                      {username || 'Unknown'}
                    </SizableText>
                  </Link>
                  <DotIcon size={16} color="$color10" />
                  <SizableText size="$3" color="$color10">
                    {formatDistanceToNow(post.createdAt)}
                  </SizableText>
                </XStack>
                <PostActionMenu post={post} isOwnPost={isOwnProfile} />
              </XStack>
            </YStack>
          </XStack>
        </XStack>
        <View>
          <Text
            flex={1}
            flexBasis="auto"
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
          <View width="100%" position="relative" mt="$2">
            <Pressable onPress={() => router.push(`/home/feed/post/${post.id}`)}>
              <PostImage
                postId={post.id}
                image={post.image}
                caption={post.caption}
                aspectRatio={aspectRatio}
                onAspectRatioChange={storedAspectRatio ? undefined : setAspectRatio}
              />
            </Pressable>
          </View>
          <XStack pt="$2" items="center" gap="$2">
            <Link href={`/home/feed/post/${post.id}`}>
              <Button
                variant="transparent"
                size="medium"
                icon={<ChatCircleIcon size={22} color="$color11" />}
              >
                {typeof post.commentCount === 'number' && post.commentCount > 0 && (
                  <Button.Text color="$color11" fontWeight="600">
                    {post.commentCount}
                  </Button.Text>
                )}
              </Button>
            </Link>
            {post.comments?.[0] && (
              <Link href={`/home/feed/post/${post.id}`} flex={1}>
                <PostCommentPreview comment={post.comments[0]} />
              </Link>
            )}
          </XStack>
        </View>
      </View>
    </View>
  )
})
