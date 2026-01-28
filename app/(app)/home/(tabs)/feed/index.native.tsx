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
import { Button } from '~/interface/buttons/Button'
import { AnimatedHomeHeader } from '~/interface/headers/AnimatedHomeHeader'
import { ArrowUpIcon } from '~/interface/icons/phosphor/ArrowUpIcon'
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
    <PageLayout bottomOffset={8}>
      <AnimatedHomeHeader scrollY={scrollY} />
      <AnimatePresence>
        {isLoading && (
          <YStack
            key="studio-shimmer"
            transition="200ms"
            exitStyle={{ opacity: 0 }}
            opacity={1}
            bg="$background"
            z={1000}
            position="absolute"
            t={headerHeight + insets.top}
            l={0}
            r={0}
            b={0}
          >
            <HomeShimmer />
          </YStack>
        )}
      </AnimatePresence>

      <View flex={1} px="$2">
        <AnimatedLegendList
          ref={listRef}
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onEndReachedThreshold={0.5}
          // TODO: padding top here causes the content pushed sometimes
          contentContainerStyle={{ paddingTop: 44 + insets.top, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="white"
              colors={['white']}
              progressViewOffset={44 + insets.top}
            />
          }
        />

        {/* scroll to top button */}
        <AnimatePresence>
          {showScrollToTop && (
            <YStack
              key="scroll-to-top"
              transition="200ms"
              position="absolute"
              b={88}
              r={32}
              z={1000}
              enterStyle={{ scale: 0.5, y: 30 }}
              exitStyle={{ scale: 0.5, y: 30 }}
            >
              <Button
                glass
                size="large"
                circular
                onPress={() =>
                  listRef.current?.scrollToOffset({ offset: 0, animated: true })
                }
              >
                <ArrowUpIcon size={20} color="white" />
              </Button>
            </YStack>
          )}
        </AnimatePresence>
      </View>
    </PageLayout>
  )
})
