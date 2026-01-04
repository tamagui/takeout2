import { useEmitter } from '@take-out/helpers'
import { memo, useCallback, useRef, useState } from 'react'
import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatePresence, SizableText, Spinner, View, YStack } from 'tamagui'

import { PostCard } from '~/features/feed/PostCard'
import { usePostsPaginated } from '~/features/feed/usePosts'
import { scrollToTopEmitter } from '~/features/main/scrollToTopEmitter'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { ArrowUpIcon } from '~/interface/icons/phosphor/ArrowUpIcon'
import { PageLayout } from '~/interface/pages/PageLayout'
import { HomeShimmer } from '~/interface/shimmer/HomeShimmer'

import type { Post } from '~/data/types'

export const HomePage = memo(() => {
  const listRef = useRef<FlatList>(null)
  const { posts, loadMore, isLoading, hasMore } = usePostsPaginated()
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const headerHeight = 60
  const insets = useSafeAreaInsets()

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y
    setShowScrollToTop(scrollY > 300)
  }, [])

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
      return (
        <YStack flex={1} items="center" justify="center" p="$4" minH={400}>
          <Spinner size="large" />
        </YStack>
      )
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
    <PageLayout>
      <View flex={1} px="$3">
        <AnimatePresence>
          {isLoading && (
            <YStack
              key="studio-shimmer"
              animation="200ms"
              exitStyle={{ opacity: 0 }}
              opacity={1}
              z={999}
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

        <FlatList
          ref={listRef}
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        />

        {/* scroll to top button */}
        <AnimatePresence>
          {showScrollToTop && (
            <YStack
              key="scroll-to-top"
              animation="quick"
              position="absolute"
              b={88}
              r={32}
              z={1000}
              enterStyle={{ scale: 0.5, y: 30 }}
              exitStyle={{ scale: 0.5, y: 30 }}
            >
              <ButtonSimple
                glass
                size="large"
                circular
                onPress={() =>
                  listRef.current?.scrollToOffset({ offset: 0, animated: true })
                }
              >
                <ArrowUpIcon size={20} color="white" />
              </ButtonSimple>
            </YStack>
          )}
        </AnimatePresence>
      </View>
    </PageLayout>
  )
})
