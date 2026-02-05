import { formatDistanceToNow } from '@take-out/helpers'
import { router } from 'one'
import { memo, useState } from 'react'
import Animated, { SharedTransition } from 'react-native-reanimated'
import { SizableText, XStack, YStack } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { Link } from '~/interface/app/Link'
import { Pressable } from '~/interface/buttons/Pressable'
import { ChatCircleDotsIcon } from '~/interface/icons/phosphor/ChatCircleDotsIcon'
import { FastSquircleView } from '~/interface/view/FastSquircleView'

import { AvatarWithMenu } from './AvatarWithMenu'
import { PostActionMenu } from './PostActionMenu'
import { PostCommentPreview } from './PostCommentPreview'

import type { PostWithLatestComment } from '~/data/types'

const transition = SharedTransition.springify().damping(15)

interface PostCardProps {
  post: PostWithLatestComment
}

export const PostCard = memo(({ post }: PostCardProps) => {
  const { user } = useAuth()
  const authorId = post.userId
  // user is loaded with the post query, no N+1
  const avatarUrl = post.user?.image
  const username = post.user?.username

  const storedAspectRatio =
    post.imageWidth && post.imageHeight ? post.imageWidth / post.imageHeight : undefined
  const [aspectRatio, setAspectRatio] = useState<number>(storedAspectRatio ?? 1.5)
  const isOwnProfile = authorId === user?.id

  const handleImagePress = () => {
    router.push(`/home/feed/post/${post.id}`)
  }

  return (
    <FastSquircleView
      mt="$3"
      rounded={25}
      cornerSmoothing={1}
      overflow="hidden"
      data-testid={`post-card-${post.id}`}
      py="$4"
      px="$3.5"
      gap="$3"
      $theme-dark={{
        bg: '$shadow4',
      }}
    >
      <XStack items="center" gap="$3">
        <AvatarWithMenu
          avatarUrl={avatarUrl || ''}
          userId={authorId}
          username={username || ''}
          isOwnProfile={isOwnProfile}
        />

        <YStack flex={1}>
          <SizableText size="$4" fontWeight="700" color="$color12">
            {username || 'Unknown'}
          </SizableText>
          <SizableText size="$3" color="$color9">
            {formatDistanceToNow(post.createdAt)}
          </SizableText>
        </YStack>

        <PostActionMenu post={post} isOwnPost={isOwnProfile} />
      </XStack>

      {post.caption && (
        <SizableText size="$5" m="$-0.25" color="$color12" my="$1" numberOfLines={3}>
          {post.caption}
        </SizableText>
      )}

      <Pressable onPress={handleImagePress}>
        <FastSquircleView
          width="100%"
          rounded={16}
          overflow="hidden"
          style={[{ aspectRatio: Math.max(aspectRatio, 0.8) }]}
          cornerSmoothing={1}
        >
          <Animated.Image
            source={{ uri: post.image }}
            style={{ width: '100%', height: '100%' }}
            sharedTransitionTag={`post-image-${post.id}`}
            sharedTransitionStyle={transition}
            resizeMode="cover"
            onLoad={
              storedAspectRatio
                ? undefined
                : (e) => {
                    const { width, height } = e.nativeEvent.source
                    if (width && height) {
                      setAspectRatio(width / height)
                    }
                  }
            }
          />
        </FastSquircleView>
      </Pressable>

      <XStack items="center" gap="$3" p="$2">
        <Link href={`/home/feed/post/${post.id}`} asChild>
          <XStack items="center" gap="$2">
            <ChatCircleDotsIcon size={26} color="$color" />
            {typeof post.commentCount === 'number' && post.commentCount > 0 && (
              <SizableText size="$4" fontWeight="700">
                {post.commentCount}
              </SizableText>
            )}
          </XStack>
        </Link>
        {post.comments?.[0] && (
          <Link href={`/home/feed/post/${post.id}`} flex={1}>
            <PostCommentPreview comment={post.comments[0]} />
          </Link>
        )}
      </XStack>
    </FastSquircleView>
  )
})
