import { randomId } from '@take-out/helpers'
import { LinearGradient } from '@tamagui/linear-gradient'
import { createRoute } from 'one'
import { memo, useState } from 'react'
import Animated, { SharedTransition } from 'react-native-reanimated'
import { SizableText, XStack, YStack, isWeb } from 'tamagui'

import { isNative } from '~/constants/platform'
import { postById } from '~/data/queries/post'
import { useAuth } from '~/features/auth/client/authClient'
import { CommentInput } from '~/features/feed/CommentInput'
import { CommentSection } from '~/features/feed/CommentSection'
import { PostActionMenu } from '~/features/feed/PostActionMenu'
import { PostActionsPopover } from '~/features/feed/PostActionsPopover'
import { useUser } from '~/features/user/useUser'
import { formatDistanceToNow } from '~/helpers/date/formatDate'
import { Avatar } from '~/interface/avatars/Avatar'
import { Pressable } from '~/interface/buttons/Pressable'
import { galleryEmitter } from '~/interface/gallery/galleryEmitter'
import { DotIcon } from '~/interface/icons/phosphor/DotIcon'
import { Image } from '~/interface/image/Image'
import { KeyboardAwareScrollView } from '~/interface/keyboard/KeyboardAwareScrollView'
import { Text } from '~/interface/text/Text'
import { useQuery, zero } from '~/zero/client'

const route = createRoute<'/(app)/(tabs)/home/post/[feedId]'>()

const transition = SharedTransition.springify().damping(15)

export const FeedDetailPage = memo(() => {
  const { feedId = '' } = route.useParams()
  const { user: currentUser } = useAuth()
  const { user } = useUser()
  const [post] = useQuery(postById, { postId: feedId })
  const isOwnProfile = post?.userId === user?.id

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

  return (
    <>
      {/* Dark gradient background */}
      {!isWeb && (
        <LinearGradient
          colors={['#313131', 'transparent']}
          position="absolute"
          t={0}
          l={0}
          r={0}
          b={0}
          height={200}
        />
      )}

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
            {isNative ? (
              <PostActionMenu post={post} isOwnPost={isOwnProfile} />
            ) : (
              <PostActionsPopover post={post} isOwnPost={isOwnProfile} />
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
            <Image
              key={`${post.id.toString()}`}
              src={post.image}
              width="100%"
              aspectRatio={1}
              objectFit="cover"
              rounded="$6"
            />
          </Pressable>
        ) : (
          <YStack mb="$4">
            <Animated.Image
              source={{ uri: post.image }}
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: 12,
              }}
              sharedTransitionTag={`post-image-${post.id}`}
              sharedTransitionStyle={transition}
              resizeMode="cover"
            />
          </YStack>
        )}

        <YStack>
          <Text>{post.caption}</Text>
        </YStack>

        <CommentSection postId={feedId} />
      </KeyboardAwareScrollView>

      <CommentInput
        user={currentUser}
        content={content}
        setContent={setContent}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  )
})
