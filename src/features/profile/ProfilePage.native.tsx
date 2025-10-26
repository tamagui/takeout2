import { Image as ExpoImage } from 'expo-image'
import { router, useParams } from 'one'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { FlatList, ScrollView } from 'react-native'
import {
  AnimatePresence,
  Spinner,
  Tabs,
  useTheme,
  useWindowDimensions,
  View,
  XStack,
  YStack,
} from 'tamagui'
import { images } from '~/constants/images'
import { FEATURE_FLAGS } from '~/features/feature-flags'
import { Pressable } from '~/interface/buttons/Pressable'
import { useStatsigClient } from '~/features/feature-flags/usePostHog'
import { Image } from '~/interface/image/Image'
import { usePageHeader } from '~/interface/pages/PageHeader'
import { ProfileShimmer } from '~/interface/shimmer/ProfileShimmer'
import { H5 } from '~/interface/text/Headings'
import { usePostsByUserId } from '../feed/usePosts'
import { useUser } from '../user/useUser'
import { useUserStats } from '../user/useUserStats'
import { mockTransactionData } from './mockTransactionData'
import { ProfileCompletionCards } from './ProfileCompletionCards'
import { ProfileHeader } from './ProfileHeader'
import { ProfileTopHeader } from './ProfileTopHeader'
import { TabItem } from './TabItem'
import { TransactionRow } from './TransactionRow'

const DEFAULT_HEADER_HEIGHT = 300

type TabType = 'grid' | 'transactions' | 'analytics'

export const ProfilePage = memo(() => {
  const { headerHeight } = usePageHeader()
  const theme = useTheme()
  const { client } = useStatsigClient()
  const [activeTab, setActiveTab] = useState<TabType>('grid')

  const { width } = useWindowDimensions()
  const imageSize = (width - 4) / 3

  // Feature flags
  const showTradingTabs = client.checkGate(FEATURE_FLAGS.PROFILE_ENABLE_TRADING_TABS)
  const showCompletionCards = client.checkGate(
    FEATURE_FLAGS.PROFILE_SHOW_COMPLETION_CARDS
  )

  // Get userId from params
  const { userId } = useParams<{ userId: string }>()

  // Get current user
  const { user: currentUser } = useUser()

  // Get profile user data with all stats
  const { stats, isLoading: isLoadingUser } = useUserStats()

  // Mock user data for now
  const profileUser = userId ? null : null
  const followersCount = 0
  const followingCount = 0
  const postsCount = 0

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

  // Check if profile is incomplete (only for own profile and when feature flag is enabled)
  const profileIncomplete =
    showCompletionCards &&
    isOwnProfile &&
    (!userInfo?.socialLinks ||
      Object.keys(userInfo.socialLinks).length === 0 ||
      postsCount === 0 ||
      !userInfo?.bio ||
      userInfo.bio.trim() === '')

  const renderTabBar = useCallback(() => {
    if (!showTradingTabs) return null

    return (
      <XStack
        bg="$background"
        borderBottomWidth={1}
        borderBottomColor="rgba(255,255,255,0.1)"
      >
        <Tabs.Tab
          value="grid"
          flex={1}
          py="$3"
          borderBottomWidth={2}
          borderBottomColor={activeTab === 'grid' ? '$color' : 'transparent'}
          onPress={() => setActiveTab('grid')}
        >
          <TabItem label="Grid" isActive={activeTab === 'grid'} />
        </Tabs.Tab>
        <Tabs.Tab
          value="transactions"
          flex={1}
          py="$3"
          borderBottomWidth={2}
          borderBottomColor={activeTab === 'transactions' ? '$color' : 'transparent'}
          onPress={() => setActiveTab('transactions')}
        >
          <TabItem label="ArrowDownUp" isActive={activeTab === 'transactions'} />
        </Tabs.Tab>
        <Tabs.Tab
          value="analytics"
          flex={1}
          py="$3"
          borderBottomWidth={2}
          borderBottomColor={activeTab === 'analytics' ? '$color' : 'transparent'}
          onPress={() => setActiveTab('analytics')}
        >
          <TabItem label="ChartBar" isActive={activeTab === 'analytics'} />
        </Tabs.Tab>
      </XStack>
    )
  }, [showTradingTabs, activeTab])

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

  const renderCharactersEmpty = useCallback(() => {
    return (
      <YStack p="$4" items="center" justify="center" mt="$4">
        <Image src={images.iconCamera} width={78} height={78} />
        <H5 mt="$3">No characters yet</H5>
      </YStack>
    )
  }, [])

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
            onPress={() => {
              if (isOwnProfile) {
                router.push(`profile/post/${item.id}`)
              } else {
                router.push(`home/profile/post/${item.id}`)
              }
            }}
            width={imageSize}
            height={imageSize}
            overflow="hidden"
            pressStyle={{ opacity: 1 }}
          >
            <ExpoImage
              source={item.image}
              style={{
                width: '100%',
                height: '100%',
              }}
              contentFit="cover"
              transition={200}
            />
          </Pressable>
        )}
        numColumns={3}
        style={{
          marginTop: showTradingTabs ? 0 : 24,
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

  const renderTransactionsContent = () => (
    <FlatList
      data={mockTransactionData}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 14,
      }}
      renderItem={({ item }) => (
        <TransactionRow
          avatar={item.avatar}
          name={item.name}
          change={item.change}
          amount={item.amount}
          time={item.time}
          onBuyPress={() => {
            // Handle buy press
          }}
        />
      )}
      ListEmptyComponent={() => (
        <YStack p="$4" items="center" justify="center" mt="$4">
          <Image src={images.iconCreditCard} width={78} height={78} />
          <H5 mt="$3">No transactions yet</H5>
        </YStack>
      )}
    />
  )

  const renderAnalyticsContent = () => (
    <FlatList
      data={[]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 16 }}
      renderItem={({ item }) => (
        <XStack
          px="$4"
          py="$3"
          items="center"
          justify="space-between"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        ></XStack>
      )}
      ListEmptyComponent={() => (
        <YStack p="$4" items="center" justify="center" mt="$4">
          <Image src={images.iconChart} width={78} height={78} />
          <H5 mt="$3">No analytics yet</H5>
        </YStack>
      )}
    />
  )

  return (
    <YStack flex={1}>
      <ProfileTopHeader userInfo={userInfo!} isOwnProfile={isOwnProfile} />
      <View flex={1} pt={headerHeight}>
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

        <ScrollView showsVerticalScrollIndicator={false}>
          <ProfileHeader
            userInfo={userInfo || undefined}
            isOwnProfile={isOwnProfile}
            followersCount={followersCount}
            followingCount={followingCount}
            postsCount={postsCount}
            stats={stats || undefined}
          />

          {renderTabBar()}

          <View flex={1}>
            {activeTab === 'grid' && renderGridContent()}
            {activeTab === 'transactions' && renderTransactionsContent()}
            {activeTab === 'analytics' && renderAnalyticsContent()}
          </View>
        </ScrollView>
      </View>
    </YStack>
  )
})
