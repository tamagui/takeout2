import {
  LegendList,
  type LegendListRef,
  type LegendListRenderItemProps,
} from '@legendapp/list'
import { router } from 'one'
import { memo, useCallback, useRef } from 'react'
import { RefreshControl } from 'react-native'
import Animated from 'react-native-reanimated'
import { Spinner, useWindowDimensions, YStack } from 'tamagui'

import type { Post } from '~/data/types'

import { useUserById } from '~/features/user/useUserById'
import { sharedTransition } from '~/helpers/animation/sharedTransition'
import { Pressable } from '~/interface/buttons/Pressable'
import { PageLayout } from '~/interface/pages/PageLayout'
import { H5 } from '~/interface/text/Headings'

import { usePostsByUserId } from '../feed/usePosts'
import { ProfileHeader } from './ProfileHeader'

import type { ProfilePageProps } from './types'

const COLUMN_GAP = 8
const NUM_COLUMNS = 2

export const ProfilePage = memo(({ userId, isOwnProfile }: ProfilePageProps) => {
  const listRef = useRef<LegendListRef>(null)
  const { width } = useWindowDimensions()
  const columnWidth = (width - 28 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

  const [user] = useUserById(userId)
  const { posts, isLoading, isLoadingMore, loadMore, refresh } = usePostsByUserId(userId)

  const postsCount = posts?.length || 0

  const renderPost = useCallback(
    ({ item }: LegendListRenderItemProps<Post>) => {
      return (
        <Pressable
          role="button"
          aria-label={item.caption ? `Open post: ${item.caption}` : 'Open post'}
          mb={COLUMN_GAP}
          onPress={() => router.push(`/home/profile/post/${item.id}`)}
        >
          <Animated.Image
            source={{ uri: item.image }}
            style={{
              width: columnWidth,
              height: columnWidth,
              borderRadius: 8,
            }}
            sharedTransitionTag={`profile-post-image-${item.id}`}
            sharedTransitionStyle={sharedTransition}
            resizeMode="cover"
          />
        </Pressable>
      )
    },
    [columnWidth],
  )

  const keyExtractor = useCallback((item: Post) => item.id, [])

  const renderEmpty = useCallback(() => {
    if (isLoading) return null
    return (
      <YStack p="4" items="center" justify="center" mt="4">
        <H5 mt="3">No posts yet</H5>
      </YStack>
    )
  }, [isLoading])

  const renderFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <YStack p="4" items="center" justify="center">
          <Spinner size="small" />
        </YStack>
      )
    }
    return null
  }, [isLoadingMore])

  const renderHeader = useCallback(() => {
    return (
      <ProfileHeader
        userInfo={user}
        isOwnProfile={isOwnProfile}
        postsCount={postsCount}
      />
    )
  }, [user, isOwnProfile, postsCount])

  const listContent = (
    <LegendList
      ref={listRef}
      data={posts || []}
      renderItem={renderPost}
      keyExtractor={keyExtractor}
      numColumns={NUM_COLUMNS}
      columnWrapperStyle={{ gap: COLUMN_GAP }}
      getFixedItemSize={() => columnWidth + COLUMN_GAP}
      recycleItems
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: 14,
        paddingBottom: 100,
      }}
    />
  )

  return <PageLayout>{listContent}</PageLayout>
})
