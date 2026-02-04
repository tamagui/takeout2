import { formatDistanceToNow, randomId } from '@take-out/helpers'
import { router, useParams } from 'one'
import { memo, useRef, useState } from 'react'
import { ScrollView, SizableText, useMedia, View, XStack, YStack } from 'tamagui'

import { postDetail } from '~/data/queries/post'
import { useAuth } from '~/features/auth/client/authClient'
import { CommentInput } from '~/features/feed/CommentInput'
import { CommentSection } from '~/features/feed/CommentSection'
import { PostActionMenu } from '~/features/feed/PostActionMenu'
import { PostImage } from '~/features/feed/PostImage'
import { HeadInfo } from '~/interface/app/HeadInfo'
import { Avatar } from '~/interface/avatars/Avatar'
import { Button } from '~/interface/buttons/Button'
import { Pressable } from '~/interface/buttons/Pressable'
import { galleryEmitter } from '~/interface/gallery/galleryEmitter'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { DotIcon } from '~/interface/icons/phosphor/DotIcon'
import { Text } from '~/interface/text/Text'
import { useQuery, zero } from '~/zero/client'

/**
 * Full-page post detail view for hard navigation (direct URL, refresh).
 * For soft navigation (clicking a post in feed), the intercepting route
 * at @modal/(.)post/[feedId].tsx handles showing a modal overlay.
 */
export const FeedDetailPage = memo(() => {
  const { feedId = '' } = useParams<{ feedId?: string }>()
  const { user: currentUser } = useAuth()
  const [post] = useQuery(postDetail, { postId: feedId })
  const author = post?.user
  const isOwnProfile = post?.userId === currentUser?.id
  const media = useMedia()
  const isWideScreen = media.lg

  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const commentsScrollRef = useRef<HTMLElement>(null)
  const pageScrollRef = useRef<HTMLElement>(null)

  const handleBack = () => {
    router.navigate('/home/feed')
  }

  const handleSubmit = async () => {
    if (!content.trim() || !currentUser?.id) return

    setIsSubmitting(true)

    try {
      zero.mutate.comment.insert({
        id: randomId(),
        postId: feedId,
        userId: currentUser.id,
        content: content.trim(),
        createdAt: Date.now(),
      })
      setContent('')
      setIsSubmitting(false)

      setTimeout(() => {
        const scrollTarget = isWideScreen
          ? commentsScrollRef.current
          : pageScrollRef.current
        if (scrollTarget instanceof HTMLElement) {
          scrollTarget.style.scrollBehavior = 'smooth'
          scrollTarget.scrollTop = scrollTarget.scrollHeight - scrollTarget.clientHeight
        }
      }, 100)
    } catch (error) {
      console.error('Failed to post comment:', error)
      setIsSubmitting(false)
    }
  }

  if (!post || !author) {
    return null
  }

  const postTitle = post.caption
    ? post.caption.length > 60
      ? `${post.caption.slice(0, 60)}...`
      : post.caption
    : `Post by @${author.username}`

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
      <Avatar gradient image={author.image as string} size={32} />
      <XStack flex={1}>
        <YStack flex={1} gap="$2">
          <XStack items="center" gap="$1">
            <SizableText size="$4" fontWeight="600" numberOfLines={1}>
              {author.username}
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

  const ogImage = post.image
    ? {
        images: [{ url: post.image, width: 1200, height: 630 }],
      }
    : undefined

  // wide screen: two-column layout
  if (isWideScreen) {
    return (
      <YStack height="90vh" items="center" justify="center" p="$4">
        <HeadInfo
          title={postTitle}
          description={post.caption || undefined}
          openGraph={ogImage}
        />
        <XStack
          bg="$background"
          position="relative"
          rounded={16}
          overflow="hidden"
          borderWidth={1}
          borderColor="$color4"
          maxW={860}
          height={500}
          width="100%"
          gap="$4"
        >
          <XStack position="absolute" l={8} t={8} z={10}>
            <Button
              size="medium"
              circular
              theme="accent"
              cursor="pointer"
              onPress={handleBack}
            >
              <CaretLeftIcon size={24} color="$color12" />
            </Button>
          </XStack>
          <YStack flex={1} bg="$color1">
            <Pressable flex={1} onPress={openGallery}>
              <PostImage
                postId={post.id}
                image={post.image}
                caption={post.caption}
                fill
              />
            </Pressable>
          </YStack>

          <YStack width={380} pt="$4">
            <YStack pb="$4" borderBottomWidth={1} borderColor="$borderColor">
              {postHeader}
            </YStack>
            <ScrollView ref={commentsScrollRef as any} flex={1}>
              <YStack pl="$2" pb="$4">
                <CommentSection comments={post.comments} />
              </YStack>
            </ScrollView>

            <YStack pb="$4" pr="$4">
              {commentInput}
            </YStack>
          </YStack>
        </XStack>
      </YStack>
    )
  }

  // mobile: full-page scroll view
  return (
    <ScrollView
      ref={pageScrollRef as any}
      flex={1}
      transition="medium"
      enterStyle={{ opacity: 0, y: 10 }}
      pb={60}
      showsVerticalScrollIndicator={false}
    >
      <HeadInfo
        title={postTitle}
        description={post.caption || undefined}
        openGraph={ogImage}
      />
      <YStack py="$4">{postHeader}</YStack>
      <Pressable onPress={openGallery} mb="$4">
        <PostImage postId={post.id} image={post.image} caption={post.caption} />
      </Pressable>

      <YStack>
        <Text>{post.caption}</Text>
      </YStack>

      <CommentSection comments={post.comments} />

      <YStack py="$4">{commentInput}</YStack>
    </ScrollView>
  )
})
