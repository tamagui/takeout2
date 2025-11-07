import type { FlashListRef } from '@shopify/flash-list'
import { FlashList } from '@shopify/flash-list'
import { useParams } from 'one'
import { memo, useCallback, useRef } from 'react'
import { RefreshControl } from 'react-native'
import { AnimatePresence, Spinner, useWindowDimensions, YStack } from 'tamagui'
import { images } from '~/constants/images'
import { Pressable } from '~/interface/buttons/Pressable'
import { Image } from '~/interface/image/Image'
import { usePageHeader } from '~/interface/pages/PageHeader'
import { ProfileShimmer } from '~/interface/shimmer/ProfileShimmer'
import { H5 } from '~/interface/text/Headings'
import { usePostsByUserId } from '../feed/usePosts'
import { useUser } from '../user/useUser'
import { ProfileHeader } from './ProfileHeader'

const COLUMN_GAP = 8

export const ProfilePage = memo(() => {
  const { headerHeight } = usePageHeader()
  const listRef = useRef<FlashListRef<any>>(null)

  const { width } = useWindowDimensions()
  const columnWidth = (width - 28 - COLUMN_GAP * 2) / 2

  const { userId } = useParams<{ userId: string }>()
  const { user: currentUser } = useUser()

  const { posts, isLoading, isLoadingMore, hasMore, loadMore, refresh } =
    usePostsByUserId(userId || currentUser?.id || '')

  const profileUser = userId ? null : null
  const postsCount = posts?.length || 0
  const isLoadingUser = false

  const isOwnProfile = !userId || userId === currentUser?.id
  const userInfo = isOwnProfile ? currentUser : profileUser

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      return (
        <Pressable
          width={columnWidth}
          mb={COLUMN_GAP}
          onPress={() => {
            // navigate to post detail
          }}
        >
          <Image
            src={item.image}
            width={columnWidth}
            height="auto"
            aspectRatio={0.6 + Math.random() * 0.8}
            rounded="$4"
          />
        </Pressable>
      )
    },
    [columnWidth]
  )

  const keyExtractor = useCallback((item: any) => item.id, [])

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
        {(isLoading || isLoadingUser) && (
          <YStack
            key="studio-shimmer"
            pt={headerHeight}
            animation="200ms"
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

      <FlashList
        ref={listRef}
        data={posts || []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        masonry
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
          // gap: COLUMN_GAP,
          paddingHorizontal: 14,
        }}
      />
    </YStack>
  )
})
