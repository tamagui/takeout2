import {
  LegendList,
  type LegendListRef,
  type LegendListRenderItemProps,
} from '@legendapp/list'
import { memo, useCallback, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isWeb, SizableText, Spinner, View, YStack } from 'tamagui'

import { PostCard } from '~/features/feed/PostCard'
import { usePostsSearch } from '~/features/feed/usePosts'
import { HeadInfo } from '~/interface/app/HeadInfo'
import { Input } from '~/interface/forms/Input'
import { HEADER_HEIGHT } from '~/interface/headers/AnimatedBlurHeader'
import { PageLayout } from '~/interface/pages/PageLayout'

import type { Post } from '~/data/types'

export const SearchPage = memo(() => {
  const { top, bottom } = useSafeAreaInsets()

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
            {isWeb ? 'Enter text to search posts' : 'Start typing to search posts'}
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

  const searchInput = (
    <YStack
      position="absolute"
      t={headerHeight}
      l={0}
      r={0}
      p="$3"
      z={99}
      $platform-web={{
        maxW: 640,
        mx: 'auto',
      }}
    >
      <Input
        glass
        placeholder="Search posts..."
        value={searchText}
        onChangeText={setSearchText}
        size="$4"
      />
    </YStack>
  )

  if (isWeb) {
    return (
      <PageLayout>
        <HeadInfo title="Search" />
        {searchInput}
        <View px="$3" pt="$10">
          {isSearching ? (
            <YStack flex={1} items="center" justify="center" p="$4" minH={400}>
              <Spinner size="large" />
              <SizableText size="$3" color="$color10" mt="$3">
                Searching...
              </SizableText>
            </YStack>
          ) : !searchText ? (
            <YStack flex={1} items="center" justify="center" p="$4" minH={400}>
              <SizableText size="$5" color="$color10">
                Enter text to search posts
              </SizableText>
            </YStack>
          ) : posts.length === 0 ? (
            <YStack flex={1} items="center" justify="center" p="$4" minH={400}>
              <SizableText size="$5" color="$color10">
                No posts found
              </SizableText>
              <SizableText size="$3" color="$color8" mt="$2">
                Try different keywords
              </SizableText>
            </YStack>
          ) : (
            posts.map((post: Post) => <PostCard key={post.id} post={post} />)
          )}
        </View>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {searchInput}
      <View flex={1} px="$3">
        <LegendList
          ref={listRef}
          data={posts}
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
