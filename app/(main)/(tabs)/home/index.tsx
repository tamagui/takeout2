import { LegendList, type LegendListRef } from '@legendapp/list'
import { isAndroid, isNative, useEmitter } from '@tamatko/helpers'
import { memo, useCallback, useRef } from 'react'
import { RefreshControl } from 'react-native'
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatePresence, SizableText, Spinner, View, YStack } from 'tamagui'
import { PostCard } from '~/features/feed/PostCard'
import { usePostsPaginated } from '~/features/feed/usePosts'
import { scrollToTopEmitter } from '~/features/main-tabs/scrollToTopEmitter'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { ArrowUpIcon } from '~/interface/icons/phosphor/ArrowUpIcon'
import { HomeShimmer } from '~/interface/shimmer/HomeShimmer'

const AnimatedLegendList = Animated.createAnimatedComponent(LegendList)

export const HomePage = memo(() => {
  const safeAreaInsets = useSafeAreaInsets()
  const listRef = useRef<LegendListRef>(null)
  const { posts, loadMore, refresh, isLoading, hasMore } = usePostsPaginated()

  const scrollY = useSharedValue<number>(0)
  const headerHeight = 60 + safeAreaInsets.top

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y
  })
  const scrollToTopStyle = useAnimatedStyle(() => {
    const showButton = scrollY.value > 300
    return {
      opacity: withSpring(showButton ? 1 : 0),
      transform: [
        {
          scale: withSpring(showButton ? 1 : 0.5),
        },
        {
          translateY: withSpring(showButton ? 0 : 20),
        },
      ],
      pointerEvents: showButton ? 'auto' : 'none',
    }
  })

  useEmitter(scrollToTopEmitter, (tab) => {
    if (tab === 'home') {
      listRef.current?.scrollToOffset({ offset: 0, animated: true })
    }
  })

  const renderItem = useCallback(({ item }: any) => {
    return <PostCard post={item} />
  }, [])

  const keyExtractor = useCallback((item: any) => item.id, [])

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

        {isNative && (
          <SizableText size="$3" color="$color8" mt="$2">
            Pull to refresh
          </SizableText>
        )}
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
    <View flex={1}>
      <AnimatePresence>
        {isLoading && (
          <YStack
            key="studio-shimmer"
            animation="200ms"
            exitStyle={{
              opacity: 0,
            }}
            opacity={1}
            z={999}
            position="absolute"
            t={headerHeight}
            l={0}
            r={0}
            b={0}
          >
            <HomeShimmer />
          </YStack>
        )}
      </AnimatePresence>

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
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
        contentContainerStyle={{
          paddingBottom: safeAreaInsets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      />

      {/* Scroll to top button */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: isAndroid ? 33 : 66 + safeAreaInsets.bottom,
            right: 16,
            zIndex: 1000,
          },
          scrollToTopStyle,
        ]}
      >
        <ButtonSimple
          size="large"
          circular
          glass
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        >
          <ArrowUpIcon size={20} color="white" />
        </ButtonSimple>
      </Animated.View>
    </View>
  )
})
