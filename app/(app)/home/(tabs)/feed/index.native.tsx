import { LegendList, type LegendListRef } from '@legendapp/list'
import { useEmitter } from '@take-out/helpers'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { RefreshControl } from 'react-native'
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'
import { AnimatePresence, SizableText, Spinner, Square, View, YStack } from 'tamagui'

import { scrollToTopEmitter } from '~/features/app/scrollToTopEmitter'
import { PostCard } from '~/features/feed/PostCard'
import { usePostsPaginated } from '~/features/feed/usePosts'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { AnimatedHomeHeader } from '~/interface/headers/AnimatedHomeHeader'
import { HelloTakeout } from '~/interface/hello-takeout/HelloTakeout'
import { ArrowUpIcon } from '~/interface/icons/phosphor/ArrowUpIcon'
import { LiquidGlassTakeout } from '~/interface/liquid-glass/LiquidGlassTakeout'
import { PageLayout } from '~/interface/pages/PageLayout'
import { HomeShimmer } from '~/interface/shimmer/HomeShimmer'

import type { LegendListProps } from '@legendapp/list'
import type { Post } from '~/data/types'

const AnimatedLegendList = Animated.createAnimatedComponent(
  LegendList
) as React.ComponentType<
  LegendListProps<Post> & { onScroll?: any } & React.RefAttributes<LegendListRef>
>

export const HomePage = memo(() => {
  const listRef = useRef<LegendListRef>(null)
  const [showIntro, setShowIntro] = useState(true)
  const { posts, loadMore, isLoading, hasMore, refresh } = usePostsPaginated()
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const headerHeight = 44
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)

  // stop refreshing when data loads
  useEffect(() => {
    if (isRefreshing && posts.length > 0) {
      setIsRefreshing(false)
    }
  }, [isRefreshing, posts.length])

  const updateScrollToTop = useCallback((show: boolean) => {
    setShowScrollToTop(show)
  }, [])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    refresh()
  }, [refresh])

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
      const shouldShow = event.contentOffset.y > 300
      scheduleOnRN(updateScrollToTop, shouldShow)
    },
  })

  useEmitter(scrollToTopEmitter, (tab) => {
    if (tab === 'home') {
      listRef.current?.scrollToOffset({ offset: 0, animated: true })
    }
  })

  const renderItem = useCallback(({ item }: { item: Post }) => {
    return <PostCard post={item} />
  }, [])

  const keyExtractor = useCallback((item: Post) => item.id, [])

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return null
    }
    return (
      <YStack flex={1} items="center" justify="center" p="$4" minH={400}>
        <SizableText size="$5" color="$color10">
          No posts yet
        </SizableText>
      </YStack>
    )
  }, [isLoading])

  const renderFooter = useCallback(() => {
    if (!hasMore || posts.length === 0) return null
    return (
      <YStack p="$4" items="center">
        <Spinner size="small" />
      </YStack>
    )
  }, [hasMore, posts.length])

  return (
    <View flex={1} bg="white">
      {/* <HelloTakeout /> */}
      {/* <LiquidGlassTakeout /> */}
      <LiquidGlassTakeout onComplete={() => setShowIntro(false)} duration={4000} />
    </View>
  )
})
