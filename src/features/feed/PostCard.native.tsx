import { BlurView } from 'expo-blur'
import { router } from 'one'
import { memo, useState } from 'react'
import { StyleSheet } from 'react-native'
import Animated, { SharedTransition } from 'react-native-reanimated'
import { SizableText, styled, XStack, YStack } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { formatDistanceToNow } from '~/helpers/date/formatDate'
import { useUser } from '~/hooks/useUser'
import { Link } from '~/interface/app/Link'
import { Avatar } from '~/interface/avatars/Avatar'
import { Pressable } from '~/interface/buttons/Pressable'
import { ChatCircleDotsIcon } from '~/interface/icons/phosphor/ChatCircleDotsIcon'
import { HeartIcon } from '~/interface/icons/phosphor/HeartIcon'
import { FastSquircleView } from '~/interface/view/FastSquircleView'

import { useIsDark } from '../theme/useIsDark'
import { PostActionMenu } from './PostActionMenu'

import type { Post } from '~/data/types'

const transition = SharedTransition.springify().damping(15)

interface PostCardProps {
  post: Post
}

export const PostCard = memo(({ post }: PostCardProps) => {
  const isDark = useIsDark()
  const { user } = useAuth()
  const authorId = post.userId
  const [author] = useUser(authorId)
  const avatarUrl = author?.image
  const username = author?.username

  const [aspectRatio, setAspectRatio] = useState<number>(1)
  const isOwnProfile = authorId === user?.id

  const handleImagePress = () => {
    router.push(`/home/post/${post.id}?username=${username}`)
  }

  return (
    <FastSquircleView
      mt="$3"
      rounded={30}
      cornerSmoothing={1}
      overflow="hidden"
      data-testid={`post-card-${post.id}`}
      p="$3"
      gap="$3"
    >
      <BlurView
        intensity={100}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      {/* header row: avatar with gradient border + name/time + options */}
      <XStack items="center" gap="$3">
        <Avatar image={avatarUrl} name={username || ''} size={40} gradient />

        {/* name and time */}
        <YStack flex={1}>
          <SizableText size="$4" fontWeight="700" color="$color12">
            {username}
          </SizableText>
          <SizableText size="$2" color="$color10">
            {formatDistanceToNow(post.createdAt)}
          </SizableText>
        </YStack>

        {/* options button */}
        <PostActionMenu post={post} isOwnPost={isOwnProfile} />
      </XStack>

      {/* caption */}
      {post.caption && (
        <SizableText size="$4" color="$color12" numberOfLines={3}>
          {post.caption}
        </SizableText>
      )}

      {/* image in squircle */}
      <Pressable onPress={handleImagePress}>
        <FastSquircleView
          width="100%"
          rounded={30}
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
            onLoad={(e) => {
              const { width, height } = e.nativeEvent.source
              if (width && height) {
                setAspectRatio(width / height)
              }
            }}
          />
        </FastSquircleView>
      </Pressable>

      {/* comment button */}

      <XStack items="center" gap="$4" p="$2">
        <XStack items="center" gap="$2">
          <HeartIcon size={20} color="$color" />
          {typeof post.commentCount === 'number' && post.commentCount > 0 && (
            <SizableText size="$3" fontWeight="700">
              {post.commentCount}
            </SizableText>
          )}
        </XStack>
        <Link href={`/home/post/${post.id}?username=${username}`}>
          <XStack items="center" gap="$2">
            <ChatCircleDotsIcon size={20} color="$color" />
            {typeof post.commentCount === 'number' && post.commentCount > 0 && (
              <SizableText size="$3" fontWeight="700">
                {post.commentCount}
              </SizableText>
            )}
          </XStack>
        </Link>
      </XStack>
    </FastSquircleView>
  )
})
