import { memo, useCallback, useEffect, useRef } from 'react'
import { FlatList, RefreshControl } from 'react-native'
import { AnimatePresence, SizableText, Spinner, View, YStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useEmitter } from '@vxrn/helpers'
import { PageHeader } from '~/interface/pages/PageHeaderSimple'
import { scrollToTopEmitter } from '../main-tabs/scrollToTopEmitter'
import { PostCard } from './PostCard'
import { usePostsPaginated } from './usePosts'

export const FeedPage = memo(() => {
  const safeAreaInsets = useSafeAreaInsets()
  const listRef = useRef<FlatList<any>>(null)
  const { posts, loadMore, refresh, isLoading, hasMore } = usePostsPaginated()

  // Handle scroll to top
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
        <YStack flex={1} items="center" justify="center" p="$4">
          <Spinner size="large" />
        </YStack>
      )
    }
    return (
      <YStack flex={1} items="center" justify="center" p="$4">
        <SizableText size="$5" color="$color10">
          No posts yet
        </SizableText>
        <SizableText size="$3" color="$color8" mt="$2">
          Pull to refresh
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
    <YStack flex={1} bg="$background">
      <PageHeader title="Home" />
      <FlatList
        ref={listRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
        contentContainerStyle={{
          paddingBottom: safeAreaInsets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      />
    </YStack>
  )
})
