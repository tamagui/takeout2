import { formatDistanceToNow, randomId } from '@take-out/helpers'
import { closeIntercept, createRoute, useParams } from 'one'
import { useEffect, useRef, useState } from 'react'
import { Dialog, ScrollView, SizableText, VisuallyHidden, XStack, YStack } from 'tamagui'

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
import { DotIcon } from '~/interface/icons/phosphor/DotIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { useQuery, zero } from '~/zero/client'

const route = createRoute<'/@modal/(.)post/[feedId]'>()

const EXIT_ANIMATION_DURATION = 200

/**
 * Post detail modal using intercepting routes.
 *
 * This route intercepts /home/feed/post/[feedId] when navigating via Link (soft navigation).
 * The modal opens while the feed stays visible in the background.
 *
 * On hard navigation (direct URL, refresh), this route is NOT used.
 * Instead, the full page at (app)/home/(tabs)/feed/post/[feedId] renders.
 */
export default function PostDetailModal() {
  const { feedId = '' } = useParams<{ feedId?: string }>()
  const { user: currentUser } = useAuth()
  const [post] = useQuery(postDetail, { postId: feedId })
  const author = post?.user
  const isOwnProfile = post?.userId === currentUser?.id
  const [isClosing, setIsClosing] = useState(false)

  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const commentsScrollRef = useRef<HTMLElement>(null)

  const handleClose = () => {
    if (isClosing) return
    setIsClosing(true)
  }

  useEffect(() => {
    if (!isClosing) return
    const timer = setTimeout(() => {
      closeIntercept()
    }, EXIT_ANIMATION_DURATION)
    return () => clearTimeout(timer)
  }, [isClosing])

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
        if (commentsScrollRef.current instanceof HTMLElement) {
          commentsScrollRef.current.style.scrollBehavior = 'smooth'
          commentsScrollRef.current.scrollTop =
            commentsScrollRef.current.scrollHeight -
            commentsScrollRef.current.clientHeight
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

  const modalContent = (
    <>
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
            onPress={handleClose}
          >
            <XIcon size={24} color="$color12" />
          </Button>
        </XStack>
        <YStack flex={1} bg="$color1">
          <Pressable flex={1} onPress={openGallery}>
            <PostImage postId={post.id} image={post.image} caption={post.caption} fill />
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
    </>
  )

  return (
    <Dialog modal open={!isClosing} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal z={500_000}>
        <Dialog.Overlay
          key="overlay"
          bg="$shadow6"
          opacity={0.8}
          transition="200ms"
          backdropFilter="blur(8px)"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          onPress={(e) => {
            handleClose()
            e.stopPropagation()
          }}
        />

        <Dialog.Content
          key="content"
          unstyled
          z={1_000_000}
          transition={[
            '200ms',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          borderWidth={0.5}
          borderColor="$color3"
          rounded="$6"
          overflow="hidden"
          height={500}
          opacity={1}
          scale={1}
          y={0}
          enterStyle={{ y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ y: 10, opacity: 0, scale: 0.95 }}
        >
          <VisuallyHidden>
            <Dialog.Title>{postTitle}</Dialog.Title>
          </VisuallyHidden>
          <YStack flex={1} items="center" justify="center" position="relative">
            {modalContent}
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
