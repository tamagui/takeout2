// Need to use .native because react-native-collapsible-tab-view is used

import { Image as ExpoImage } from 'expo-image'
import { router, useParams } from 'one'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import {
  MaterialTabBar,
  Tabs,
  type CollapsibleRef,
  type TabBarProps,
} from 'react-native-collapsible-tab-view'
import type {
  TabItemProps,
  TabName,
} from 'react-native-collapsible-tab-view/lib/typescript/src/types'
import {
  AnimatePresence,
  Spinner,
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

export const ProfilePage = memo(() => {
  const tabsRef = useRef<CollapsibleRef>(null)
  const { headerHeight } = usePageHeader()
  const theme = useTheme()
  const { client } = useStatsigClient()
  const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState(DEFAULT_HEADER_HEIGHT)

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
  const {
    user: profileUser,
    stats,
    followersCount,
    followingCount,
    postsCount,
    isLoading: isLoadingUser,
  } = useUserStats(userId)

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

  const makeLabel = useCallback(
    <T extends TabName>(label: string) =>
      (props: TabItemProps<T>) => (
        <TabItem index={props.index} indexDecimal={props.indexDecimal} label={label} />
      ),
    []
  )

  const handleHeaderLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout
    setMeasuredHeaderHeight(height)
  }, [])

  const renderTabBar = (props: TabBarProps) => (
    <>
      {showTradingTabs ? (
        <>
          <MaterialTabBar
            {...props}
            style={{
              backgroundColor: theme.background.val,
            }}
            indicatorStyle={{
              backgroundColor: theme.color.val,
              height: 2,
              position: 'absolute',
              zIndex: 999,
              bottom: 0,
            }}
            labelStyle={{ color: theme.color11.val }}
          />
          <View
            position="absolute"
            b={0}
            z={0}
            width="100%"
            height={2}
            bg="rgba(255,255,255,0.1)"
          />
        </>
      ) : null}
    </>
  )

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

        <Tabs.Container
          ref={tabsRef}
          headerHeight={measuredHeaderHeight}
          renderHeader={() => (
            <View onLayout={handleHeaderLayout}>
              <ProfileHeader
                userInfo={userInfo}
                isOwnProfile={isOwnProfile}
                followersCount={followersCount}
                followingCount={followingCount}
                postsCount={postsCount}
                stats={stats}
              />
            </View>
          )}
          revealHeaderOnScroll
          snapThreshold={0.5}
          renderTabBar={renderTabBar}
        >
          <Tabs.Tab name="grid" label={makeLabel('Grid')}>
            {profileIncomplete ? (
              <Tabs.ScrollView showsVerticalScrollIndicator={false}>
                <ProfileCompletionCards userInfo={userInfo!} postsCount={postsCount} />
              </Tabs.ScrollView>
            ) : (
              <>
                <Tabs.FlatList
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
              </>
            )}
          </Tabs.Tab>

          {/* The Tab render logic looks wierd but Tabs doesn't allow <Fragment> */}
          {showTradingTabs ? (
            <Tabs.Tab name="arrowDownUp" label={makeLabel('ArrowDownUp')}>
              <Tabs.FlatList
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
            </Tabs.Tab>
          ) : null}

          {showTradingTabs ? (
            <Tabs.Tab name="chartBar" label={makeLabel('ChartBar')}>
              <Tabs.FlatList
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
            </Tabs.Tab>
          ) : null}
        </Tabs.Container>
      </View>
    </YStack>
  )
})
