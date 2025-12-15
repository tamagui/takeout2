import { LegendList, type LegendListRef } from '@legendapp/list'
import { memo, useCallback, useMemo, useRef } from 'react'
import { RefreshControl } from 'react-native'
import { AnimatePresence, Spinner, useWindowDimensions, YStack } from 'tamagui'

import { userById } from '~/data/queries/user'
import { useHeaderHeightSafe } from '~/hooks/useHeaderHeightSafe'
import { GalleryImage, GalleryWrapper } from '~/interface/gallery/Gallery'
import { Image } from '~/interface/image/Image'
import { ProfileShimmer } from '~/interface/shimmer/ProfileShimmer'
import { H5 } from '~/interface/text/Headings'
import { useQuery } from '~/zero/client'

import { usePostsByUserId } from '../feed/usePosts'
import { ProfileHeader } from './ProfileHeader'

import type { ProfilePageProps } from './types'

const COLUMN_GAP = 8
const NUM_COLUMNS = 2

export const ProfilePage = memo(({ userId, isOwnProfile }: ProfilePageProps) => {
  const listRef = useRef<LegendListRef>(null)
  const headerHeight = useHeaderHeightSafe()
  const { width } = useWindowDimensions()
  const columnWidth = (width - 28 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

  const [user] = useQuery(userById, { userId })
  const { posts, isLoading, isLoadingMore, loadMore, refresh } = usePostsByUserId(userId)

  const postsCount = posts?.length || 0

  const columns = useMemo(() => {
    return Array.from({ length: NUM_COLUMNS }, (_, colIndex) => {
      return (posts || []).filter((_, index) => index % NUM_COLUMNS === colIndex)
    })
  }, [posts])

  const allImageUrls = useMemo(() => {
    return posts?.map((post) => post.image) || []
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
            const fullIndex = posts?.findIndex((p) => p.id === item.id) || 0

            return (
              <GalleryImage key={item.id} index={fullIndex}>
                <Image
                  src={item.image}
                  width={columnWidth}
                  height={height}
                  rounded="$4"
                />
              </GalleryImage>
            )
          })}
        </YStack>
      )
    },
    [columnWidth, posts]
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

  return (
    <YStack flex={1}>
      <AnimatePresence>
        {isLoading && (
          <YStack
            key="studio-shimmer"
            animation="200ms"
            pt={headerHeight}
            exitStyle={{
              opacity: 0,
            }}
            opacity={1}
            z={999}
            position="absolute"
            t={10}
            l={0}
            r={0}
            b={0}
          >
            <ProfileShimmer />
          </YStack>
        )}
      </AnimatePresence>
      <GalleryWrapper urls={allImageUrls}>{listContent}</GalleryWrapper>
    </YStack>
  )
})
