import {
  LegendList,
  type LegendListProps,
  type LegendListRef,
  type LegendListRenderItemProps,
} from '@legendapp/list'
import { isNative } from '@take-out/helpers'
import { useNavigation } from 'one'
import { memo, useCallback, useLayoutEffect, useRef } from 'react'
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, Spinner, View, YStack } from 'tamagui'

import { PostCard } from '~/features/feed/PostCard'
import { usePostsSearch } from '~/features/feed/usePosts'
import { Input } from '~/interface/forms/Input'
import { AnimatedBlurHeader, HEADER_HEIGHT } from '~/interface/headers/AnimatedBlurHeader'
import { PageLayout } from '~/interface/pages/PageLayout'

import type { NativeSyntheticEvent, TextInputChangeEventData } from 'react-native'
import type { Post } from '~/data/types'

const AnimatedLegendList = Animated.createAnimatedComponent(
  LegendList
) as React.ComponentType<
  LegendListProps<Post> & { onScroll?: any } & React.RefAttributes<LegendListRef>
>

export const SearchPage = memo(() => {
  const navigation = useNavigation()
  const { top, bottom } = useSafeAreaInsets()
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })
  const listRef = useRef<LegendListRef>(null)
  const { posts, searchText, setSearchText, isSearching, loadMore, hasMore } =
    usePostsSearch()

  const renderItem = useCallback(({ item }: LegendListRenderItemProps<Post>) => {
    return <PostCard post={item} />
  }, [])

  const keyExtractor = useCallback((item: Post) => item.id, [])

  const renderEmpty = useCallback(() => {
    if (isSearching) {
      return (
        <YStack flex={1} items="center" justify="center" p="$4" minH={400}>
          <Spinner size="large" />
          <SizableText size="$3" color="$color10" mt="$3">
            Searching...
          </SizableText>
        </YStack>
      )
    }

    if (!searchText) {
      return (
        <YStack flex={1} items="center" justify="center" p="$4" minH={400}>
          <SizableText size="$5" color="$color10">
            {isNative ? 'Start typing to search posts' : 'Enter text to search posts'}
          </SizableText>
        </YStack>
      )
    }

    return (
      <YStack flex={1} items="center" justify="center" p="$4" minH={400}>
        <SizableText size="$5" color="$color10">
          No posts found
        </SizableText>
        <SizableText size="$3" color="$color8" mt="$2">
          Try different keywords
        </SizableText>
      </YStack>
    )
  }, [isSearching, searchText])

  const renderFooter = useCallback(() => {
    if (!hasMore || posts.length === 0) return null
    return (
      <YStack p="$4" items="center">
        <Spinner size="small" />
      </YStack>
    )
  }, [hasMore, posts.length])

  const headerHeight = HEADER_HEIGHT + top

  return (
    <PageLayout>
      {/* <AnimatedBlurHeader scrollY={scrollY} title="Search" /> */}
      <YStack position="absolute" t={headerHeight} l={0} r={0} p="$3" z={99}>
        <Input
          glass
          placeholder="Search posts..."
          value={searchText}
          onChangeText={setSearchText}
          size="small"
        />
      </YStack>
      <View flex={1} px="$3">
        <AnimatedLegendList
          ref={listRef}
          data={posts}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{
            paddingTop: 40,
            paddingBottom: bottom + 100,
          }}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        />
      </View>
    </PageLayout>
  )
})
