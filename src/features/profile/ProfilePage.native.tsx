import { LegendList, type LegendListRef } from '@legendapp/list'
import { router } from 'one'
import { memo, useCallback, useMemo, useRef } from 'react'
import { RefreshControl } from 'react-native'
import Animated from 'react-native-reanimated'
import { Spinner, useWindowDimensions, YStack } from 'tamagui'

import { sharedTransition } from '~/helpers/animation/sharedTransition'
import { useUser } from '~/hooks/useUser'
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

  const [user] = useUser(userId)
  const { posts, isLoading, isLoadingMore, loadMore, refresh } = usePostsByUserId(userId)

  const postsCount = posts?.length || 0

  const columns = useMemo(() => {
    return Array.from({ length: NUM_COLUMNS }, (_, colIndex) => {
      return (posts || []).filter((_, index) => index % NUM_COLUMNS === colIndex)
    })
  }, [posts])

  const renderColumn = useCallback(
    ({ item: columnData, index: columnIndex }: { item: any[]; index: number }) => {
      return (
        <YStack
          flex={1}
          gap={COLUMN_GAP}
          pl={columnIndex === 0 ? 0 : COLUMN_GAP / 2}
          pr={columnIndex === NUM_COLUMNS - 1 ? 0 : COLUMN_GAP / 2}
        >
          {columnData.map((item) => {
            const aspectRatio = 0.6 + Math.random() * 0.8
            const height = columnWidth / aspectRatio

            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/home/profile/post/${item.id}`)}
              >
                <Animated.Image
                  source={{ uri: item.image }}
                  style={{
                    width: columnWidth,
                    height,
                    borderRadius: 8,
                  }}
                  sharedTransitionTag={`profile-post-image-${item.id}`}
                  sharedTransitionStyle={sharedTransition}
                  resizeMode="cover"
                />
              </Pressable>
            )
          })}
        </YStack>
      )
    },
    [columnWidth]
  )

  const keyExtractor = useCallback((_item: any, index: number) => `column-${index}`, [])

  const renderEmpty = useCallback(() => {
    if (isLoading) return null
    return (
      <YStack p="$4" items="center" justify="center" mt="$4">
        <H5 mt="$3">No posts yet</H5>
      </YStack>
    )
  }, [isLoading])

  const renderFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <YStack p="$4" items="center" justify="center">
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
      data={columns}
      renderItem={renderColumn}
      keyExtractor={keyExtractor}
      numColumns={2}
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
