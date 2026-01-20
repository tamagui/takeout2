import { formatDistanceToNow, randomId } from '@take-out/helpers'
import { router, useParams } from 'one'
import { memo, useState } from 'react'
import { ScrollView, SizableText, useMedia, XStack, YStack } from 'tamagui'

import { postById } from '~/data/queries/post'
import { useAuth } from '~/features/auth/client/authClient'
import { CommentInput } from '~/features/feed/CommentInput'
import { CommentSection } from '~/features/feed/CommentSection'
import { PostActionMenu } from '~/features/feed/PostActionMenu'
import { PostImage } from '~/features/feed/PostImage'
import { useUser } from '~/features/user/useUser'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Pressable } from '~/interface/buttons/Pressable'
import { galleryEmitter } from '~/interface/gallery/galleryEmitter'
import { DotIcon } from '~/interface/icons/phosphor/DotIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { Text } from '~/interface/text/Text'
import { useQuery, zero } from '~/zero/client'

export const FeedDetailPage = memo(() => {
  const { feedId = '' } = useParams<{ feedId?: string }>()
  const { user: currentUser } = useAuth()
  const { user } = useUser()
  const [post] = useQuery(postById, { postId: feedId })
  const isOwnProfile = post?.userId === user?.id
  const media = useMedia()
  const isWideScreen = media.md

  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() || !currentUser?.id) return

    setIsSubmitting(true)

    try {
      await zero.mutate.comment.insert({
        id: randomId(),
        postId: feedId,
        userId: currentUser.id,
        content: content.trim(),
        createdAt: Date.now(),
      })
      setContent('')
      setIsSubmitting(false)
    } catch (error) {
      console.error('Failed to post comment:', error)
      setIsSubmitting(false)
    }
  }

  if (!post || !user) {
    return null
  }

  const openGallery = () => {
    galleryEmitter.emit({
      items: [{ id: post.id.toString(), url: post.image }],
      firstItem: post.id.toString(),
    })
  }

  const commentInput = (
    <CommentInput
      user={currentUser}
      content={content}
      setContent={setContent}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )

  const postHeader = (
    <XStack gap="$2" pr="$4">
      <Avatar gradient image={user.image as string} size={32} />
      <XStack flex={1}>
        <YStack flex={1} gap="$2">
          <XStack items="center" gap="$1">
            <SizableText size="$4" fontWeight="600" numberOfLines={1}>
              {user.username}
            </SizableText>
            <DotIcon size={16} color="$color10" />
            <SizableText size="$3" color="$color10">
              {formatDistanceToNow(post.createdAt)}
            </SizableText>
          </XStack>
          <SizableText>{post.caption}</SizableText>
        </YStack>
        <PostActionMenu post={post} isOwnPost={isOwnProfile} />
      </XStack>
    </XStack>
  )

  if (isWideScreen) {
    return (
      <YStack flex={1} items="center" justify="center" position="relative">
        <ButtonSimple
          size="large"
          circular
          theme="accent"
          position="absolute"
          t={30}
          r={0}
          cursor="pointer"
          onPress={() => {
            router.back()
          }}
        >
          <XIcon size={24} color="$color12" />
        </ButtonSimple>
        <XStack
          bg="$background"
          rounded={16}
          overflow="hidden"
          borderWidth={1}
          borderColor="$color4"
          maxW={1100}
          width="100%"
          minH={500}
          maxH={700}
          gap="$4"
        >
          <YStack flex={1} bg="$color1" minW={400}>
            <Pressable onPress={openGallery}>
              <PostImage postId={post.id} image={post.image} caption={post.caption} />
            </Pressable>
          </YStack>

          <YStack width={380} pt="$4">
            <YStack pb="$4" borderBottomWidth={1} borderColor="$borderColor">
              {postHeader}
            </YStack>
            <ScrollView flex={1} pl="$2" pb="$4" bg="transparent">
              <CommentSection postId={feedId} />
            </ScrollView>

            <YStack pb="$4" pr="$4">
              {commentInput}
            </YStack>
          </YStack>
        </XStack>
      </YStack>
    )
  }

  return (
    <YStack flex={1}>
      <YStack py="$4">{postHeader}</YStack>
      <Pressable onPress={openGallery} mb="$4">
        <PostImage postId={post.id} image={post.image} caption={post.caption} />
      </Pressable>

      <YStack>
        <Text>{post.caption}</Text>
      </YStack>

      <CommentSection postId={feedId} />

      <YStack py="$4">{commentInput}</YStack>
    </YStack>
  )
})
