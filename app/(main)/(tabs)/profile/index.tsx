import { LegendList, type LegendListRef } from '@legendapp/list'
import { useHeaderHeight } from '@react-navigation/elements'
import { useParams } from 'one'
import { memo, useCallback, useMemo, useRef } from 'react'
import { RefreshControl } from 'react-native'
import { AnimatePresence, Spinner, useWindowDimensions, YStack } from 'tamagui'
import { images } from '~/constants/images'
import { usePostsByUserId } from '~/features/feed/usePosts'
import { ProfileHeader } from '~/features/profile/ProfileHeader'
import { useUser } from '~/features/user/useUser'
import { Pressable } from '~/interface/buttons/Pressable'
import { Image } from '~/interface/image/Image'
import { ProfileShimmer } from '~/interface/shimmer/ProfileShimmer'
import { H5 } from '~/interface/text/Headings'

const COLUMN_GAP = 8
const NUM_COLUMNS = 2

export const ProfilePage = memo(() => {
  const listRef = useRef<LegendListRef>(null)
  const headerHeight = useHeaderHeight() || 0
  const { width } = useWindowDimensions()
  const columnWidth = (width - 28 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

  const { userId } = useParams<{ userId: string }>()
  const { user: currentUser } = useUser()

  const { posts, isLoading, isLoadingMore, hasMore, loadMore, refresh } =
    usePostsByUserId(userId || currentUser?.id || '')

  const profileUser = userId ? null : null
  const postsCount = posts?.length || 0

  const isOwnProfile = !userId || userId === currentUser?.id
  const userInfo = isOwnProfile ? currentUser : profileUser

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
                onPress={() => {
                  // navigate to post detail
                }}
              >
                <Image
                  src={item.image}
                  width={columnWidth}
                  height={height}
                  rounded="$4"
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
        <Image src={images.iconPicture} width={78} height={78} />
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
        userInfo={userInfo || undefined}
        isOwnProfile={isOwnProfile}
        postsCount={postsCount}
      />
    )
  }, [userInfo, isOwnProfile, postsCount])

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
        }}
      />
    </YStack>
  )
})
