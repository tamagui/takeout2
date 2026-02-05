import { formatDistanceToNow, randomId } from '@take-out/helpers'
import { useNavigation, useParams, usePathname } from 'one'
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useKeyboardHandler } from 'react-native-keyboard-controller'
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  scrollTo,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnUI } from 'react-native-worklets'
import { SizableText, XStack, YStack } from 'tamagui'

import { postDetail } from '~/data/queries/post'
import { useAuth } from '~/features/auth/client/authClient'
import { CommentInput } from '~/features/feed/CommentInput'
import { CommentSection } from '~/features/feed/CommentSection'
import { PostActionMenu } from '~/features/feed/PostActionMenu'
import { PostImage } from '~/features/feed/PostImage'
import { Avatar } from '~/interface/avatars/Avatar'
import { PageLayout } from '~/interface/pages/PageLayout'
import { Text } from '~/interface/text/Text'
import { useQuery, zero } from '~/zero/client'

const INPUT_BAR_HEIGHT = 60

export const FeedDetailPage = memo(() => {
  const { feedId = '' } = useParams<{ feedId?: string }>()
  const pathname = usePathname()
  const { user: currentUser } = useAuth()
  const [post] = useQuery(postDetail, { postId: feedId })
  const author = post?.user
  const isOwnProfile = post?.userId === currentUser?.id
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

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
  const shouldScrollToEnd = useRef(false)

  // keyboard handling - using concurrent-safe .get()/.set()
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const keyboardHeight = useSharedValue(0)
  const contentHeight = useSharedValue(0)
  const containerHeight = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({})

  const scrollToEndWorklet = () => {
    'worklet'
    const kbHeight = keyboardHeight.get()
    const cHeight = contentHeight.get()
    const ctHeight = containerHeight.get()
    const maxScroll = cHeight - ctHeight + kbHeight + INPUT_BAR_HEIGHT
    if (maxScroll > 0) {
      scrollTo(scrollRef, 0, maxScroll, true)
    }
  }

  useKeyboardHandler({
    onMove: (event) => {
      'worklet'
      keyboardHeight.set(event.height)
    },
    onEnd: (event) => {
      'worklet'
      keyboardHeight.set(event.height)

      // when keyboard opens, scroll to end to show comments
      if (event.height > 0) {
        scrollToEndWorklet()
      }
    },
  })

  const inputContainerStyle = useAnimatedStyle(() => {
    const kbHeight = keyboardHeight.get()
    return {
      transform: [{ translateY: -kbHeight }],
      paddingBottom: kbHeight > 0 ? 0 : insets.bottom,
    }
  })

  const scrollViewStyle = useAnimatedStyle(() => {
    const kbHeight = keyboardHeight.get()
    return {
      marginBottom:
        kbHeight > 0 ? kbHeight + INPUT_BAR_HEIGHT : INPUT_BAR_HEIGHT + insets.bottom,
    }
  })

  const handleContentSizeChange = (_: number, h: number) => {
    contentHeight.set(h)
    // scroll to end when content grows after posting
    if (shouldScrollToEnd.current) {
      shouldScrollToEnd.current = false
      scheduleOnUI(scrollToEndWorklet)
    }
  }

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
      // flag to scroll when content size updates
      shouldScrollToEnd.current = true
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
      <Animated.ScrollView
        ref={scrollRef}
        style={[{ paddingHorizontal: 12 }, scrollViewStyle]}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onContentSizeChange={handleContentSizeChange}
        onLayout={(e) => {
          containerHeight.set(e.nativeEvent.layout.height)
        }}
      >
        <XStack items="center" gap="$3" py="$4">
          <Avatar gradient image={author.image as string} size={32} />
          <YStack flex={1}>
            <SizableText size="$4" fontWeight="700" color="$color12">
              {author.username || 'Unknown'}
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
      </Animated.ScrollView>

      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          inputContainerStyle,
        ]}
      >
        <CommentInput
          user={currentUser}
          content={content}
          setContent={setContent}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disableStickyFooter
          keepKeyboardOpen
        />
      </Animated.View>
    </PageLayout>
  )
})
