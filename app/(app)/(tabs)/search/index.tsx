import {
  LegendList,
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
import { AnimatedBlurHeader } from '~/interface/headers/AnimatedBlurHeader'

import type { NativeSyntheticEvent, TextInputChangeEventData } from 'react-native'
import type { Post } from '~/data/types'

const AnimatedLegendList = Animated.createAnimatedComponent(LegendList<Post>)

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

  const handleSearchTextChange = useCallback(
    (text: string) => {
      setSearchText(text)
    },
    [setSearchText]
  )

  useLayoutEffect(() => {
    if (isNative) {
      navigation.setOptions({
        headerSearchBarOptions: {
          placeholder: 'Search posts...',
          onChangeText: (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
            handleSearchTextChange(e.nativeEvent.text)
          },
        },
      })
    }
  }, [navigation, handleSearchTextChange])

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

  return (
    <View flex={1}>
      <AnimatedBlurHeader scrollY={scrollY} title="Search" />
      {!isNative && (
        <YStack p="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
          <Input
            placeholder="Search posts..."
            value={searchText}
            onChange={(e) => setSearchText((e.target as HTMLInputElement).value)}
            size="$4"
          />
        </YStack>
      )}
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
          paddingTop: isNative ? 0 : top,
          paddingBottom: bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      />
    </View>
  )
})
