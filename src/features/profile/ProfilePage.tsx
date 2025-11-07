import { router, useParams } from 'one'
import { memo, useCallback, useMemo, useRef } from 'react'
import { FlatList, ScrollView } from 'react-native'
import { AnimatePresence, Spinner, useWindowDimensions, View, YStack } from 'tamagui'
import { images } from '~/constants/images'
import { Pressable } from '~/interface/buttons/Pressable'
import { Image } from '~/interface/image/Image'
import { usePageHeader } from '~/interface/pages/PageHeader'
import { ProfileShimmer } from '~/interface/shimmer/ProfileShimmer'
import { H5 } from '~/interface/text/Headings'
import { usePostsByUserId } from '../feed/usePosts'
import { useUser } from '../user/useUser'
import { ProfileCompletionCards } from './ProfileCompletionCards'
import { ProfileHeader } from './ProfileHeader'
import { ProfileTopHeader } from './ProfileTopHeader'

export const ProfilePage = memo(() => {
  const { headerHeight } = usePageHeader()

  const { width } = useWindowDimensions()
  const imageSize = (width - 4) / 3

  // Get userId from params
  const { userId } = useParams<{ userId: string }>()

  // Get current user
  const { user: currentUser } = useUser()

  // Mock user data for now
  const profileUser = userId ? null : null
  const postsCount = 0
  const isLoadingUser = false

  // Determine if viewing own profile
  const isOwnProfile = !userId || userId === currentUser?.id
  const userInfo = isOwnProfile ? currentUser : profileUser

  // Get user's posts with pagination
  const { posts, isLoading, isLoadingMore, hasMore, loadMore, refresh } =
    usePostsByUserId(userId || currentUser?.id || '')

  // Memoize posts for grid view - only include fields actually used in the grid
  // This prevents re-renders when irrelevant fields like likesCount change
  const previousGridData = useRef<{ id: string; image: string }[]>([])
  const memoizedPosts = useMemo(() => {
    if (!posts) return []

    const newGridData = posts.map((post) => ({ id: post.id, image: post.image }))

    // Deep comparison based only on id and image fields
    const hasChanged =
      newGridData.length !== previousGridData.current.length ||
      newGridData.some((item, index) => {
        const prev = previousGridData.current[index]
        return !prev || item.id !== prev.id || item.image !== prev.image
      })

    if (hasChanged) {
      previousGridData.current = newGridData
    }

    return previousGridData.current
  }, [posts])

  // Load more items when reaching the end
  const loadMoreItems = async () => {
    if (!hasMore || isLoadingMore) return
    loadMore()
  }

  // Profile completion disabled for minimal demo
  const profileIncomplete = false

  const renderTabBar = useCallback(() => {
    // Trading tabs disabled for minimal demo
    return null
  }, [])

  const renderPostsEmpty = useCallback(() => {
    return (
      <YStack p="$4" items="center" justify="center" mt="$4">
        <Image src={images.iconPicture} width={78} height={78} />
        <H5 mt="$3">No posts yet</H5>
      </YStack>
    )
  }, [])

  const renderFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <YStack p="$4" items="center" justify="center">
          <Spinner size="small" />
        </YStack>
      )
    }
  }, [isLoadingMore])

  const renderGridContent = () => {
    if (profileIncomplete) {
      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          <ProfileCompletionCards userInfo={userInfo!} postsCount={postsCount} />
        </ScrollView>
      )
    }

    return (
      <FlatList
        key={`profile-grid-${userId || currentUser?.id}`}
        data={memoizedPosts}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {}}
            width={imageSize}
            height={imageSize}
            overflow="hidden"
            pressStyle={{ opacity: 1 }}
          >
            <Image
              src={item.image}
              style={{
                width: '100%',
                height: '100%',
              }}
              objectFit="cover"
            />
          </Pressable>
        )}
        numColumns={3}
        style={{
          marginTop: 24,
        }}
        contentContainerStyle={{
          gap: 2,
          paddingBottom: 100,
        }}
        columnWrapperStyle={{
          gap: 2,
        }}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreItems}
        onEndReachedThreshold={0.1}
        onRefresh={refresh}
        refreshing={isLoading}
        ListEmptyComponent={renderPostsEmpty}
        ListFooterComponent={renderFooter}
      />
    )
  }

  return (
    <YStack flex={1}>
      {/* <ProfileTopHeader userInfo={userInfo!} isOwnProfile={isOwnProfile} /> */}
      <View flex={1}>
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <ProfileHeader
            userInfo={userInfo || undefined}
            isOwnProfile={isOwnProfile}
            postsCount={postsCount}
          />

          {renderTabBar()}

          <View flex={1}>{renderGridContent()}</View>
        </ScrollView>
      </View>
    </YStack>
  )
})
