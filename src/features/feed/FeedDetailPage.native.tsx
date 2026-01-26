import { formatDistanceToNow, randomId } from '@take-out/helpers'
import { useNavigation, useParams, usePathname } from 'one'
import { memo, useLayoutEffect, useMemo, useState } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'

import { postDetail } from '~/data/queries/post'
import { useAuth } from '~/features/auth/client/authClient'
import { CommentInput } from '~/features/feed/CommentInput'
import { CommentSection } from '~/features/feed/CommentSection'
import { PostActionMenu } from '~/features/feed/PostActionMenu'
import { PostImage } from '~/features/feed/PostImage'
import { Avatar } from '~/interface/avatars/Avatar'
import { KeyboardAwareScrollView } from '~/interface/keyboard/KeyboardAwareScrollView'
import { PageLayout } from '~/interface/pages/PageLayout'
import { Text } from '~/interface/text/Text'
import { useQuery, zero } from '~/zero/client'

export const FeedDetailPage = memo(() => {
  const { feedId = '' } = useParams<{ feedId?: string }>()
  const pathname = usePathname()
  const { user: currentUser } = useAuth()
  const [post] = useQuery(postDetail, { postId: feedId })
  const author = post?.user
  const isOwnProfile = post?.userId === currentUser?.id
  const navigation = useNavigation()

  useLayoutEffect(() => {
    if (!post) return
    navigation.setOptions({
      headerRight: () => <PostActionMenu post={post} isOwnPost={isOwnProfile} />,
    })
  }, [navigation, post, isOwnProfile])

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

  if (!post || !author) {
    return null
  }

  return (
    <PageLayout>
      <KeyboardAwareScrollView
        style={{ paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <XStack items="center" gap="$3" py="$4">
          <Avatar gradient image={author.image as string} size={32} />
          <YStack flex={1}>
            <SizableText size="$4" fontWeight="700" color="$color12">
              {author.username}
            </SizableText>
            <SizableText size="$2" color="$color10">
              {formatDistanceToNow(post.createdAt)}
            </SizableText>
          </YStack>
        </XStack>

        <YStack mb="$4">
          <PostImage
            postId={post.id}
            image={post.image}
            caption={post.caption}
            sharedTransitionTag={sharedTag}
          />
        </YStack>

        <YStack>
          <Text>{post.caption}</Text>
        </YStack>

        <CommentSection comments={post.comments} />
      </KeyboardAwareScrollView>
      <CommentInput
        user={currentUser}
        content={content}
        setContent={setContent}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </PageLayout>
  )
})
