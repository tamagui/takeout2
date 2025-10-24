import { BlurView } from 'expo-blur'
import { useRouter } from 'one'
import { memo, useCallback, useMemo } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { runOnJS } from 'react-native-worklets'
import { useTheme, View, XStack, YStack } from 'tamagui'
import { useAuth } from '~/auth/client/authClient'
import { kHeight, kWidth } from '~/constants/deviceSizes'
import { useCurrentChannelId } from '~/context/CurrentChannelContext'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import type { User } from '~/data/types'
import { useAppTheme } from '~/features/app/AppTheme'
import { useCurrentServer } from '~/features/server/useCurrentServer'
import { getPrivateChatLink } from '~/features/user/getPrivateChatLink'
import { UserBubble } from '~/features/user/ui/UserBubble.native'
import { useFriends } from '~/features/user/useFriends'
import { useLatestNotifications } from '~/interface/activity/useLatestNotifications'
import Glint from '~/interface/effects/Glint'
import { haptics } from '~/interface/haptics/haptics'

// Constants for the three stages
const COLLAPSED_HEIGHT = 100
const MID_HEIGHT = kHeight * 0.4 // 20% of screen
const EXPANDED_HEIGHT = kHeight * 0.85 // 85% of screen

const COLLAPSED_WIDTH = kWidth - 32 // 16px margin on each side
const EXPANDED_WIDTH = kWidth

const DRAG_THRESHOLD = 20 // px to trigger expansion when released
const VELOCITY_THRESHOLD = 500 // velocity to trigger snap

const AVATAR_SIZE = (kWidth - 142) / 5

const RADIUS = 32

// Animation configs
const EXPAND_SPRING_CONFIG = {
  damping: 18,
  mass: 0.5,
  stiffness: 250,
}

const COLLAPSE_SPRING_CONFIG = {
  damping: 18,
  mass: 0.5,
  stiffness: 180,
}

interface FriendItemProps {
  user: User
  userServerId: string | null
  notification?: any
}

const FriendItem = memo(({ user, userServerId, notification }: FriendItemProps) => {
  const router = useRouter()
  const serverId = useCurrentServerId()
  const channelId = useCurrentChannelId()

  if (!userServerId) return null

  const handlePress = () => {
    const link = getPrivateChatLink({
      userServerId,
      serverId,
      channelId,
    })
    router.push(link)
  }

  return (
    <TouchableOpacity onPress={handlePress}>
      <UserBubble user={user} notification={notification} circleSize={AVATAR_SIZE} />
    </TouchableOpacity>
  )
})

interface AnimatedFriendItemProps extends FriendItemProps {
  index: number
  currentHeight: SharedValue<number>
  sheetState: SharedValue<SheetState>
}

const AnimatedFriendItem = memo(
  ({
    user,
    userServerId,
    notification,
    index,
    currentHeight,
    sheetState,
  }: AnimatedFriendItemProps) => {
    const router = useRouter()
    const serverId = useCurrentServerId()
    const channelId = useCurrentChannelId()

    const animatedStyle = useAnimatedStyle(() => {
      // Calculate progress for fade animation
      const progress = interpolate(
        currentHeight.value,
        [COLLAPSED_HEIGHT, COLLAPSED_HEIGHT + 20, MID_HEIGHT],
        [0, 0, 1],
        Extrapolation.CLAMP
      )

      // Add staggered fade-in effect based on index
      const staggerDelay = index * 0.08
      const adjustedProgress = Math.max(
        0,
        Math.min(1, (progress - staggerDelay) / (1 - staggerDelay))
      )

      // Simple fade in/out animation
      const opacity =
        sheetState.value === 'collapsed'
          ? withTiming(0, { duration: 150 })
          : withTiming(adjustedProgress, { duration: 250 })

      return {
        opacity,
        // Hide completely when collapsed to save space
        display: sheetState.value === 'collapsed' ? 'none' : 'flex',
      }
    })

    if (!userServerId) return null

    const handlePress = () => {
      const link = getPrivateChatLink({
        userServerId,
        serverId,
        channelId,
      })
      router.push(link)
    }

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity onPress={handlePress}>
          <UserBubble user={user} notification={notification} circleSize={AVATAR_SIZE} />
        </TouchableOpacity>
      </Animated.View>
    )
  }
)

type SheetState = 'collapsed' | 'mid' | 'expanded'

export const FriendBottomSheet = memo(() => {
  const { bottom } = useSafeAreaInsets()
  const { background08 } = useTheme()
  const { colors } = useAppTheme()
  // Shared values for animations
  const translateY = useSharedValue(0)
  const currentHeight = useSharedValue(COLLAPSED_HEIGHT)
  const sheetState = useSharedValue<SheetState>('collapsed')
  const contextY = useSharedValue(0)

  // Process friend data
  const { notifications } = useLatestNotifications()
  const { topPrivateChats } = useCurrentServer()
  const { user: currentUser } = useAuth()
  const friends = useFriends()
  const allChats = useMemo(() => {
    const recentChats =
      topPrivateChats?.map((stat) => {
        const otherUser = stat.userAId === currentUser?.id ? stat.userB : stat.userA
        return {
          user: otherUser,
          notification: notifications.find((n) => n.fromUserId === otherUser?.id),
          userServerId: stat.userServerId,
          userServer: stat.userServer,
          score: stat.score,
          lastMessageAt: stat.lastMessageAt,
        }
      }) || []

    const recentChatUserIds = new Set(
      recentChats.map((chat) => chat.user?.id).filter(Boolean)
    )

    const remainingFriends =
      friends?.filter((friend) => !recentChatUserIds.has(friend.id)) || []

    const realData = [
      ...recentChats,
      ...remainingFriends
        .slice(0, Math.max(0, 10 - recentChats.length))
        .map((friend) => ({
          user: friend,
          userServerId: null,
          score: 0,
          lastMessageAt: null,
          notification: notifications.find((n) => n.fromUserId === friend.id),
        })),
    ]

    // Add mock data for testing UI - remove this in production
    const mockUsers = Array.from({ length: 12 }, (_, i) => ({
      user: {
        id: `mock-${i}`,
        username: `user${i + 1}`,
        name: `Mock User ${i + 1}`,
        image: `https://i.pravatar.cc/150?img=${i + 1}`,
        createdAt: Date.now(),
      },
      userServerId: `mock-server-${i}`,
      userServer: null,
      score: 0,
      lastMessageAt: null,
      notification: i % 3 === 0 ? { id: `notif-${i}`, fromUserId: `mock-${i}` } : null,
    }))

    // Use mock data if no real data
    const allChats = realData

    // Split into visible (first 5) and expandable (rest)
    return {
      visibleChats: allChats.slice(0, 5),
      expandableChats: allChats.slice(5),
    }
  }, [topPrivateChats, currentUser, notifications, friends])

  // Separate the data into two lists for cleaner rendering
  const { visibleChats, expandableChats } = allChats as any

  // Snap to position helper
  const snapToPosition = useCallback(
    (state: SheetState) => {
      'worklet'
      let targetHeight = COLLAPSED_HEIGHT
      const previousState = sheetState.value

      switch (state) {
        case 'collapsed':
          targetHeight = COLLAPSED_HEIGHT
          break
        case 'mid':
          targetHeight = MID_HEIGHT
          break
        case 'expanded':
          targetHeight = EXPANDED_HEIGHT
          break
      }

      // Use different spring configs based on direction
      const isExpanding =
        (state === 'mid' && previousState === 'collapsed') ||
        (state === 'expanded' && previousState !== 'expanded')

      const springConfig = isExpanding ? EXPAND_SPRING_CONFIG : COLLAPSE_SPRING_CONFIG

      sheetState.value = state

      // Trigger haptic feedback for state changes
      if (state === 'expanded') {
        runOnJS(haptics.modalOpen)()
      } else if (state === 'collapsed') {
        runOnJS(haptics.modalClose)()
      } else {
        runOnJS(haptics.snapToPosition)()
      }

      // Animate both values smoothly from current positions
      currentHeight.value = withSpring(targetHeight, springConfig)
      translateY.value = withSpring(0, springConfig)
    },
    [currentHeight, sheetState, translateY]
  )

  // Pan gesture handler
  const gesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value
    })
    .onUpdate((event) => {
      const dragY = event.translationY

      if (sheetState.value === 'collapsed') {
        // When collapsed, move the whole sheet: max 20px up, and allow dragging down
        translateY.value = Math.max(-DRAG_THRESHOLD, dragY)
      } else if (sheetState.value === 'mid') {
        // In mid state, normal dragging
        translateY.value = contextY.value + dragY
      } else if (sheetState.value === 'expanded') {
        // In expanded state, only allow dragging down
        translateY.value = Math.max(0, contextY.value + dragY)
      }
    })
    .onEnd((event) => {
      const velocity = event.velocityY
      const currentDrag = translateY.value

      if (sheetState.value === 'collapsed') {
        // If dragged up to threshold (exactly -20px), expand to mid
        if (currentDrag <= -DRAG_THRESHOLD + 2 || velocity < -VELOCITY_THRESHOLD) {
          // Smooth transition to mid state with boom effect
          snapToPosition('mid')
        } else {
          // Fast snap back to original position
          // This handles both partial drag up and drag down cases
          translateY.value = withTiming(0, { duration: 200 })
        }
      } else if (sheetState.value === 'mid') {
        // From mid state, can go either direction
        if (velocity < -VELOCITY_THRESHOLD || currentDrag < -100) {
          snapToPosition('expanded')
        } else if (velocity > VELOCITY_THRESHOLD || currentDrag > 100) {
          snapToPosition('collapsed')
        } else {
          snapToPosition('mid')
        }
      } else if (sheetState.value === 'expanded') {
        // From expanded state
        if (velocity > VELOCITY_THRESHOLD || currentDrag > 100) {
          if (velocity > VELOCITY_THRESHOLD * 2) {
            snapToPosition('collapsed')
          } else {
            snapToPosition('mid')
          }
        } else {
          snapToPosition('expanded')
        }
      }
    })

  // Animated styles for the container
  const animatedContainerStyle = useAnimatedStyle(() => {
    // Calculate progress from collapsed to expanded
    const progress = interpolate(
      currentHeight.value,
      [COLLAPSED_HEIGHT, MID_HEIGHT, EXPANDED_HEIGHT],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    )

    // All animations complete together when progress reaches each milestone
    // Progress 0 = collapsed, 0.5 = mid, 1 = expanded

    // Width animation - instant change when starting to expand
    const width = interpolate(
      progress,
      [0, 0.05, 1],
      [COLLAPSED_WIDTH, EXPANDED_WIDTH, EXPANDED_WIDTH],
      Extrapolation.CLAMP
    )

    // Margin animation - instant change when starting to expand
    const marginHorizontal = interpolate(
      progress,
      [0, 0.05, 1],
      [16, 0, 0],
      Extrapolation.CLAMP
    )
    // Bottom position - fills out at mid state
    const bottomPosition = interpolate(
      progress,
      [0, 0.05, 0.5, 1],
      [bottom, 0, 0, 0],
      Extrapolation.CLAMP
    )

    // Height calculation
    let height = currentHeight.value
    let transform: { translateY: number }[] = []

    // When collapsed, translateY moves the whole component
    if (sheetState.value === 'collapsed') {
      transform = [{ translateY: translateY.value }]
    } else {
      // When mid/expanded, only modify height when actively dragging
      // This prevents flickering during state transitions
      if (Math.abs(translateY.value) > 1) {
        height = Math.max(COLLAPSED_HEIGHT, currentHeight.value - translateY.value)
      }
    }

    return {
      height,
      width,
      marginHorizontal,
      borderTopLeftRadius: RADIUS,
      borderTopRightRadius: RADIUS,
      borderBottomLeftRadius: sheetState.value === 'collapsed' ? RADIUS : 0,
      borderBottomRightRadius: sheetState.value === 'collapsed' ? RADIUS : 0,
      alignSelf: 'center' as const,
      bottom: bottomPosition,
      transform,
    }
  })

  // Animated style for backdrop
  const animatedBackdropStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      currentHeight.value,
      [COLLAPSED_HEIGHT, MID_HEIGHT, EXPANDED_HEIGHT],
      [0, 1, 1],
      Extrapolation.CLAMP
    )

    return {
      opacity: progress,
      pointerEvents: progress > 0 ? ('auto' as const) : ('none' as const),
    }
  })

  // Content style with matching border radius
  const animatedContentStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      currentHeight.value,
      [COLLAPSED_HEIGHT, MID_HEIGHT, EXPANDED_HEIGHT],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    )

    return {
      opacity: 1,
      borderTopLeftRadius: RADIUS,
      borderTopRightRadius: RADIUS,
      borderBottomLeftRadius: sheetState.value === 'collapsed' ? RADIUS : 0,
      borderBottomRightRadius: sheetState.value === 'collapsed' ? RADIUS : 0,
      overflow: 'hidden' as const,
    }
  })

  if (!currentUser) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            zIndex: 98,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          },
          animatedBackdropStyle,
        ]}
        onTouchEnd={() => {
          if (sheetState.value !== 'collapsed') {
            snapToPosition('collapsed')
          }
        }}
      />

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: bottom,
            backgroundColor: 'transparent',
            zIndex: 99,
            overflow: 'hidden',
          },
          animatedContainerStyle,
        ]}
      >
        <GestureDetector gesture={gesture}>
          {/* Drag Handle */}
          <YStack py="$3" pb="$2" items="center">
            <View height={5} width={40} bg="$color10" rounded="$10" />
          </YStack>
        </GestureDetector>

        {/* Content */}
        <Animated.View
          style={[{ flex: 1, borderCurve: 'continuous' }, animatedContentStyle]}
        >
          <Glint
            opacity={colors.messageInputGlintOpacity}
            $theme-light={{ opacity: 0 }}
            rounded={16}
          />
          <BlurView
            intensity={20}
            tint="default"
            style={{
              flex: 1,
              backgroundColor: background08.val,
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              scrollEnabled={sheetState.value !== 'collapsed'}
              contentContainerStyle={{
                paddingBottom: 20,
                minHeight:
                  sheetState.value === 'collapsed' ? COLLAPSED_HEIGHT - 30 : undefined,
              }}
            >
              <YStack justify="center" width="100%" gap="$4">
                <XStack pt="$2" gap="$3" items="center" justify="center">
                  {/* Always visible friends */}
                  {visibleChats?.map((item: any) => (
                    <FriendItem
                      key={item.user?.id || ''}
                      user={item.user as User}
                      userServerId={item.userServerId}
                      notification={item.notification}
                    />
                  ))}
                </XStack>

                <XStack flexWrap="wrap" gap="$3" items="center" justify="center">
                  {/* Expandable friends with animation */}
                  {expandableChats?.map((item: any, index: number) => (
                    <AnimatedFriendItem
                      key={item.user?.id || ''}
                      user={item.user as User}
                      userServerId={item.userServerId}
                      notification={item.notification}
                      index={index}
                      currentHeight={currentHeight}
                      sheetState={sheetState}
                    />
                  ))}
                </XStack>
              </YStack>
            </ScrollView>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </>
  )
})
