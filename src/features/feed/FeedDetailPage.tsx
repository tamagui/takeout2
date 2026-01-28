import { formatDistanceToNow, randomId } from '@take-out/helpers'
import { router, useParams } from 'one'
import { memo, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  ScrollView,
  SizableText,
  styled,
  useMedia,
  VisuallyHidden,
  XStack,
  YStack,
} from 'tamagui'

import { postDetail } from '~/data/queries/post'
import { useAuth } from '~/features/auth/client/authClient'
import { CommentInput } from '~/features/feed/CommentInput'
import { CommentSection } from '~/features/feed/CommentSection'
import { PostActionMenu } from '~/features/feed/PostActionMenu'
import { PostImage } from '~/features/feed/PostImage'
import { HeadInfo } from '~/interface/app/HeadInfo'
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
  const [post] = useQuery(postDetail, { postId: feedId })
  const author = post?.user
  const isOwnProfile = post?.userId === currentUser?.id
  const media = useMedia()
  const isWideScreen = media.md
  const [isClosing, setIsClosing] = useState(false)

  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const commentsScrollRef = useRef<HTMLElement>(null)
  const pageScrollRef = useRef<HTMLElement>(null)

  const handleClose = () => {
    if (isClosing) return
    setIsClosing(true)
  }

  useEffect(() => {
    if (!isClosing) return
    const timer = setTimeout(() => {
      router.navigate('/home/feed')
    }, 250)
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

      // smooth scroll to bottom after comment is added
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

  // truncate for title display
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

  if (isWideScreen) {
    return (
      <Dialog modal open={!isClosing} onOpenChange={(open) => !open && handleClose()}>
        <Dialog.Portal z={500_000}>
          <ModalOverlay
            key="overlay"
            onPress={(e) => {
              handleClose()
              e.stopPropagation()
            }}
          />

          <ModalContent key="content">
            <VisuallyHidden>
              <Dialog.Title>{postTitle}</Dialog.Title>
            </VisuallyHidden>
            <YStack flex={1} items="center" justify="center" position="relative">
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
                <ButtonSimple
                  size="medium"
                  circular
                  theme="accent"
                  position="absolute"
                  cursor="pointer"
                  l="$2"
                  t="$2"
                  onPress={handleClose}
                >
                  <XIcon size={24} color="$color12" />
                </ButtonSimple>
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
                  <ScrollView
                    ref={commentsScrollRef as any}
                    flex={1}
                    pl="$2"
                    pb="$4"
                    bg="transparent"
                  >
                    <CommentSection comments={post.comments} />
                  </ScrollView>

                  <YStack pb="$4" pr="$4">
                    {commentInput}
                  </YStack>
                </YStack>
              </XStack>
            </YStack>
          </ModalContent>
        </Dialog.Portal>
      </Dialog>
    )
  }

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

const ModalOverlay = styled(Dialog.Overlay, {
  transition: '250ms',
  bg: '$shadow6',
  opacity: 1,
  backdropFilter: 'blur(8px)',
  enterStyle: { opacity: 0 },
  exitStyle: { opacity: 0 },
})

const ModalContent = styled(Dialog.Content, {
  unstyled: true,
  z: 1_000_000,
  transition: '250ms',
  borderWidth: 0.5,
  borderColor: '$color3',
  rounded: '$6',
  overflow: 'hidden',
  height: 500,
  opacity: 1,
  scale: 1,
  y: 0,
  enterStyle: { y: -20, opacity: 0, scale: 0.9 },
  exitStyle: { y: 10, opacity: 0, scale: 0.95 },
})
