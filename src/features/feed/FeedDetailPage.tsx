import { formatDistanceToNow, randomId } from '@take-out/helpers'
import { useParams, usePathname } from 'one'
import { memo, useMemo, useState } from 'react'
import { SizableText, XStack, YStack, isWeb } from 'tamagui'

import { postById } from '~/data/queries/post'
import { useAuth } from '~/features/auth/client/authClient'
import { CommentInput } from '~/features/feed/CommentInput'
import { CommentSection } from '~/features/feed/CommentSection'
import { PostActionMenu } from '~/features/feed/PostActionMenu'
import { PostActionsPopover } from '~/features/feed/PostActionsPopover'
import { PostImage } from '~/features/feed/PostImage'
import { useUser } from '~/features/user/useUser'
import { Avatar } from '~/interface/avatars/Avatar'
import { Pressable } from '~/interface/buttons/Pressable'
import { galleryEmitter } from '~/interface/gallery/galleryEmitter'
import { DotIcon } from '~/interface/icons/phosphor/DotIcon'
import { KeyboardAwareScrollView } from '~/interface/keyboard/KeyboardAwareScrollView'
import { Text } from '~/interface/text/Text'
import { useQuery, zero } from '~/zero/client'

export const FeedDetailPage = memo(() => {
  const { feedId = '' } = useParams<{ feedId?: string }>()
  const pathname = usePathname()
  const { user: currentUser } = useAuth()
  const { user } = useUser()
  const [post] = useQuery(postById, { postId: feedId })
  const isOwnProfile = post?.userId === user?.id

  const sharedTag = useMemo(() => {
    const isFromProfile = pathname.includes('/home/profile/')
    const prefix = isFromProfile ? 'profile-post-image' : 'post-image'
    return `${prefix}-${feedId}`
  }, [pathname, feedId])

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

  const commentInput = (
    <CommentInput
      user={currentUser}
      content={content}
      setContent={setContent}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )

  return (
    <>
      <KeyboardAwareScrollView
        style={{ paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <XStack items="center" justify="space-between" py="$4">
          <XStack justify="space-between" gap="$3" width="100%">
            <XStack items="center" gap="$3" flex={1}>
              <Avatar image={user.image as string} size={32} />
              <XStack items="center" gap="$1">
                <SizableText size="$4" fontWeight="600" numberOfLines={1}>
                  {user.username}
                </SizableText>
                <DotIcon size={16} color="$color10" />
                <SizableText size="$3" color="$color10">
                  {formatDistanceToNow(post.createdAt)}
                </SizableText>
              </XStack>
            </XStack>
            {/* Todo: move to tamagui Menu (v2) */}
            {isWeb ? (
              <PostActionsPopover post={post} isOwnPost={isOwnProfile} />
            ) : (
              <PostActionMenu post={post} isOwnPost={isOwnProfile} />
            )}
          </XStack>
        </XStack>
        {isWeb ? (
          <Pressable
            onPress={() => {
              galleryEmitter.emit({
                items: [{ id: post.id.toString(), url: post.image }],
                firstItem: post.id.toString(),
              })
            }}
            mb="$4"
          >
            <PostImage postId={post.id} image={post.image} caption={post.caption} />
          </Pressable>
        ) : (
          <YStack mb="$4">
            <PostImage
              postId={post.id}
              image={post.image}
              caption={post.caption}
              sharedTransitionTag={sharedTag}
            />
          </YStack>
        )}

        <YStack>
          <Text>{post.caption}</Text>
        </YStack>

        <CommentSection postId={feedId} />

        {isWeb && commentInput}
      </KeyboardAwareScrollView>

      {!isWeb && commentInput}
    </>
  )
})
