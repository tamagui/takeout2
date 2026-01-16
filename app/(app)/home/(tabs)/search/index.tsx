// web version - avoid visual lists / reanimated

import { memo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, Spinner, View, YStack } from 'tamagui'

import { PostCard } from '~/features/feed/PostCard'
import { usePostsSearch } from '~/features/feed/usePosts'
import { Input } from '~/interface/forms/Input'
import { AnimatedBlurHeader, HEADER_HEIGHT } from '~/interface/headers/AnimatedBlurHeader'
import { PageLayout } from '~/interface/pages/PageLayout'

import type { Post } from '~/data/types'

export const SearchPage = memo(() => {
  const { top, bottom } = useSafeAreaInsets()
  const { posts, searchText, setSearchText, isSearching, loadMore, hasMore } =
    usePostsSearch()

  const headerHeight = HEADER_HEIGHT + top

  return (
    <PageLayout>
      <AnimatedBlurHeader title="Search" />
      <YStack position="absolute" t={headerHeight} l={0} r={0} p="$3" z={99}>
        <Input
          glass
          placeholder="Search posts..."
          value={searchText}
          onChangeText={setSearchText}
          size="$4"
        />
      </YStack>
      <View px="$3">
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
})
