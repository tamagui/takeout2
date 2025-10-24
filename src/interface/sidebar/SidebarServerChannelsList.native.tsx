import {
  Bell,
  Bot,
  Hash,
  Lock,
  LogOut,
  MessageCircle,
  Plus,
  Search,
} from '@tamagui/lucide-icons'
import { CornerStyle } from 'expo-liquid-glass-view'
import { useRouter } from 'one'
import { memo, useEffect, useState } from 'react'
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Circle, SizableText, View, XStack, YStack } from 'tamagui'
import { kHeight } from '~/constants/deviceSizes'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import { authClient, clearAuthClientToken } from '~/auth/client/authClient'
import { getChannelsSorted } from '~/features/channel/getChannelsSorted'
import { useServer } from '~/features/server/useCurrentServer'
import { useServerChannelsWithStatus } from '~/features/server/useServerChannels'
import { useUserServers } from '~/features/server/useUserServers'
import { UserBubble } from '~/features/user/ui/UserBubble.native'
import { updateUserState, useUserState } from '~/features/user/userState'
import { useUser } from '~/features/user/useUser'
import type {
  ChannelWithRelations,
  ServerWithMembership,
  UserWithState,
} from '~/data/types'
import { Logo } from '../app/Logo.native'
import { dialogConfirm, dialogCreateServer } from '../dialogs/actions'
import { GlassView } from '../view/GlassView'
import { FriendBottomSheet } from './FriendBottomSheet.native'

interface ServerChannelItemProps {
  server?: ServerWithMembership
  isActive: boolean
  isHome?: boolean
  isAddButton?: boolean
  onPress: () => void
  index?: number
}

interface ChannelItemProps {
  channel?: ChannelWithRelations
  isMainChannel?: boolean
  serverId: string
  index: number
}

// Glass button component with context menu
const GlassSearchButton = () => (
  <GlassView borderRadius={20}>
    <Circle width={40} height={40} items="center" justify="center">
      <Search size={20} color="#fff" />
    </Circle>
  </GlassView>
)

// Create animated version of the channel item wrapper
const AnimatedChannelWrapper = Animated.createAnimatedComponent(View)

// Modern channel item component
const ChannelItem = ({
  channel,
  serverId,
  isMainChannel = false,
  index,
}: ChannelItemProps) => {
  const router = useRouter()
  const isPrivate = channel?.private === true

  // Handle both string (for Main channel) and object channels
  const channelName = isMainChannel ? 'Main' : channel?.name
  const channelId = isMainChannel ? serverId : channel?.id

  const handlePress = () => {
    // Navigate to channel detail screen in the stack
    router.push(`/${serverId}/${channelId}`)
  }

  return (
    <AnimatedChannelWrapper
      entering={FadeInDown.delay(index * 50)}
      exiting={FadeOutDown}
      layout={LinearTransition.easing(Easing.ease)}
    >
      <YStack px="$4">
        <TouchableOpacity onPress={handlePress}>
          <GlassView borderRadius={16} containerStyle={StyleSheet.absoluteFillObject} />
          <XStack bg="transparent" px="$3" py="$3" gap="$2.5" items="center" z={1}>
            <View>
              {isPrivate ? (
                <Lock size={14} color="$color11" />
              ) : (
                <Hash size={16} color="$color11" />
              )}
            </View>
            <SizableText fontFamily="$mono" fontWeight="600" color="$color">
              {channelName}
            </SizableText>
            {channel?.type === 'bot' && <Bot size={16} color="$color11" />}
          </XStack>
        </TouchableOpacity>
      </YStack>
      {/* </GlassView> */}
      {/* Three dot menu with context menu */}
      {/* <View position="absolute" r={16} z={1}>
        <ContextMenu>
          <ContextMenu.Items>
            <Button
              systemImage={isMuted ? 'speaker.wave.2' : 'speaker.slash'}
              onPress={() => {
                setIsMuted(!isMuted)
                console.info(`${isMuted ? 'Unmute' : 'Mute'} channel:`, channelName)
              }}
            >
              {isMuted ? 'Unmute Channel' : 'Mute Channel'}
            </Button>
            <Button
              systemImage="gearshape"
              onPress={() => {
                console.info('Channel settings:', channelName)
                // TODO: Navigate to channel settings
              }}
            >
              Settings
            </Button>
            {!isPrivate && (
              <Button
                systemImage="trash"
                color="red"
                onPress={() => {
                  console.info('Delete channel:', channelName)
                  // TODO: Implement delete channel
                }}
              >
                Delete
              </Button>
            )}
          </ContextMenu.Items>
          <ContextMenu.Trigger>
            <ButtonSimple variant="transparent" pressStyle={{ bg: '$color6' }}>
              <View width={24} height={24} items="center" justify="center">
                <MoreVertical size={16} color="$color11" />
              </View>
            </ButtonSimple>
          </ContextMenu.Trigger>
        </ContextMenu>
      </View> */}
    </AnimatedChannelWrapper>
  )
}

const ServerChannelItem = memo(
  ({ server, isActive, isHome, isAddButton, onPress }: ServerChannelItemProps) => {
    const serverIcon = server?.icon as string

    // Simplified icon rendering logic
    const renderIcon = () => {
      if (isAddButton) {
        return <Plus size={28} color="$color11" strokeWidth={2} />
      }

      if (isHome) {
        return <Logo size={28} />
      }

      return (
        <Avatar circular size="$5">
          <Avatar.Image src={serverIcon} objectFit="cover" />
          <Avatar.Fallback />
        </Avatar>
      )
    }

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View position="relative">
          {isActive && !isAddButton && (
            <Circle
              position="absolute"
              r={4}
              b={0}
              width={10}
              height={10}
              bg="$red10"
              z={1}
              animation="200ms"
              enterStyle={{
                opacity: 0,
                scale: 0.5,
              }}
              exitStyle={{
                opacity: 0,
                scale: 0.5,
              }}
            />
          )}
          <GlassView width={60} height={60} borderRadius={60} intensity={40} tint="dark">
            <View width={60} height={60} items="center" justify="center">
              {renderIcon()}
            </View>
          </GlassView>
        </View>
      </TouchableOpacity>
    )
  }
)

// Memoized Header component
interface HeaderProps {
  topServers: ServerWithMembership[]
  selectedServerId: string
  setSelectedServerId: (id: string) => void
  server: any
  textChannels: ChannelWithRelations[]
  headerHeight: SharedValue<number>
  minHeaderHeight: number
}

const Header = memo(
  ({
    topServers,
    selectedServerId,
    setSelectedServerId,
    server,
    textChannels,
    headerHeight,
    minHeaderHeight,
  }: HeaderProps) => {
    const { top } = useSafeAreaInsets()
    const router = useRouter()
    const { user } = useUser()

    const handleCreateServer = async () => {
      try {
        await dialogCreateServer()
      } catch (e) {
        console.error(e)
      }
    }

    // Animated opacity for full content - fade down when disappearing
    const fullContentStyle = useAnimatedStyle(() => {
      const maxHeaderHeight = kHeight - 200 // Same as used in gesture
      const progress =
        (headerHeight.value - minHeaderHeight) / (maxHeaderHeight - minHeaderHeight)
      // Clamp progress between 0 and 1
      const clampedProgress = Math.max(0, Math.min(1, progress))

      return {
        opacity: clampedProgress,
        transform: [
          {
            translateY: (1 - clampedProgress) * 20, // Move down when disappearing
          },
        ],
      }
    })

    // Animated minimal content - slide from top -150px to position 0
    const minimalContentStyle = useAnimatedStyle(() => {
      const maxHeaderHeight = kHeight - 200 // Same as used in gesture
      const progress =
        (headerHeight.value - minHeaderHeight) / (maxHeaderHeight - minHeaderHeight)
      // Clamp progress between 0 and 1
      const clampedProgress = Math.max(0, Math.min(1, progress))

      // Slide in from top (-150) to final position (0)
      // When clampedProgress = 1 (header max), translateY = -150 (hidden above)
      // When clampedProgress = 0 (header min), translateY = 0 (in place)
      const translateY = -200 * clampedProgress

      return {
        opacity: 1 - clampedProgress, // Fade in as header gets smaller
        transform: [
          {
            translateY: translateY,
          },
        ],
        position: 'absolute' as const,
        top: top + 16,
        left: 0,
        right: 0,
        zIndex: clampedProgress < 0.5 ? 2 : 0, // Only on top when header is small
      }
    })

    return (
      <YStack flex={1}>
        {/* Minimal Header Content */}
        <Animated.View style={minimalContentStyle}>
          <YStack px="$4" mt="$2" gap="$3">
            {/* Top row with avatar and action buttons */}
            <XStack items="center" justify="space-between">
              {/* Left side - User avatar with status */}
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <XStack items="center" gap="$2">
                  <UserBubble user={user as UserWithState} circleSize={48} />
                </XStack>
              </TouchableOpacity>

              {/* Right side - Action buttons */}
              <XStack gap="$2" items="center">
                {/* Notifications */}
                <TouchableOpacity onPress={() => console.info('Friends pressed')}>
                  {/* Friend request badge */}
                  <View
                    position="absolute"
                    t={-2}
                    r={-2}
                    width={20}
                    height={20}
                    bg="$red10"
                    rounded="$10"
                    items="center"
                    justify="center"
                    borderWidth={1}
                    borderColor="$color11"
                    z={1}
                  >
                    <SizableText
                      size="$1"
                      color="white"
                      fontWeight="700"
                      fontFamily="$mono"
                    >
                      8
                    </SizableText>
                  </View>
                  <GlassView
                    borderRadius={20}
                    cornerStyle={CornerStyle.Circular}
                    intensity={30}
                    isFallback
                  >
                    <View
                      items="center"
                      justify="center"
                      width={40}
                      height={40}
                      position="relative"
                    >
                      <Bell size={18} color="$color11" />
                    </View>
                  </GlassView>
                </TouchableOpacity>

                {/* Settings */}
                <TouchableOpacity
                  onPress={async () => {
                    if (await dialogConfirm({ title: 'Log out?' })) {
                      await authClient.signOut()
                      clearAuthClientToken()
                      router.replace('/')
                    }
                  }}
                >
                  <GlassView
                    borderRadius={20}
                    cornerStyle={CornerStyle.Circular}
                    intensity={30}
                    isFallback
                  >
                    <View items="center" justify="center" width={40} height={40}>
                      <LogOut size={18} color="$color11" />
                    </View>
                  </GlassView>
                </TouchableOpacity>
              </XStack>
            </XStack>
          </YStack>
        </Animated.View>

        {/* Full Header Content */}
        <Animated.View style={[{ flex: 1, paddingTop: top + 16 }, fullContentStyle]}>
          <View mt="$2" px="$3">
            <FlatList
              data={topServers}
              renderItem={({ item, index }) => (
                <ServerChannelItem
                  server={item}
                  isActive={item.id === selectedServerId}
                  onPress={() => {
                    setSelectedServerId(item.id)
                  }}
                  index={index}
                />
              )}
              ListHeaderComponent={
                <ServerChannelItem
                  isHome
                  isActive={false}
                  onPress={() => router.push('/')}
                />
              }
              ListFooterComponent={
                <ServerChannelItem
                  isAddButton
                  isActive={false}
                  onPress={handleCreateServer}
                />
              }
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                gap: 10,
              }}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
          {/* Server Header with Glass Effect */}

          {server && (
            <Animated.View
              entering={FadeInDown.duration(300).easing(Easing.out(Easing.quad))}
            >
              <YStack px="$2" mx="$4" mt="$4">
                <GlassView
                  borderRadius={16}
                  intensity={25}
                  containerStyle={StyleSheet.absoluteFillObject}
                />
                <YStack p="$3" pr="$2" gap="$3">
                  {/* Server Avatar and Name Row */}
                  <XStack gap="$3" items="center">
                    <YStack flex={1} gap="$1">
                      <XStack justify="space-between" items="center">
                        <SizableText
                          color="$color12"
                          fontFamily="$mono"
                          fontSize="$6"
                          fontWeight="700"
                          letterSpacing={-0.5}
                        >
                          {server.name}
                        </SizableText>
                        <GlassSearchButton />
                      </XStack>

                      <XStack gap="$2" items="center">
                        <XStack gap="$1" items="center">
                          <Circle size={8} bg="$green10" />
                          <SizableText
                            color="$color11"
                            fontFamily="$mono"
                            fontWeight="600"
                            fontSize="$2"
                          >
                            {' '}
                            0 Online
                          </SizableText>
                        </XStack>

                        <SizableText fontSize="$2" color="$color08" fontFamily="$mono">
                          •
                        </SizableText>
                        <SizableText
                          color="$color11"
                          fontFamily="$mono"
                          fontWeight="600"
                          fontSize="$2"
                        >
                          {server.members?.length || 0} Total
                        </SizableText>
                      </XStack>
                    </YStack>
                  </XStack>

                  {/* Stats Row */}
                  <XStack gap="$2" flexWrap="wrap">
                    <View
                      px="$2.5"
                      py="$1.5"
                      rounded="$3"
                      borderWidth={1}
                      borderColor="$color04"
                    >
                      <XStack gap="$1.5" items="center">
                        <Hash size={12} color="$color10" />
                        <SizableText
                          color="$color10"
                          fontFamily="$mono"
                          fontWeight="600"
                          fontSize="$2"
                        >
                          {textChannels.length} Channels
                        </SizableText>
                      </XStack>
                    </View>

                    <View
                      px="$2.5"
                      py="$1.5"
                      rounded="$3"
                      borderWidth={1}
                      borderColor="$color04"
                    >
                      <XStack gap="$1.5" items="center">
                        <MessageCircle size={12} color="$color10" />
                        <SizableText
                          color="$color10"
                          fontFamily="$mono"
                          fontWeight="600"
                          fontSize="$2"
                        >
                          Community
                        </SizableText>
                      </XStack>
                    </View>
                  </XStack>
                </YStack>
              </YStack>
            </Animated.View>
          )}
          <Animated.FlatList
            data={textChannels}
            renderItem={({ item, index }) => (
              <ChannelItem channel={item} serverId={selectedServerId} index={index + 1} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingTop: 16,
              gap: 10,
            }}
          />
        </Animated.View>
      </YStack>
    )
  }
)

export const SidebarServerChannelsList = () => {
  const serverId = useCurrentServerId()
  const { top } = useSafeAreaInsets()
  const activeServer = useUserState('activeServer')
  const lastActiveChannel = useUserState('lastActiveChannel')
  const { allServers: topServers } = useUserServers()

  // Add state for selected server - use activeServer if available, otherwise route serverId
  const [selectedServerId, setSelectedServerId] = useState(activeServer || serverId)

  // Fetch server and channels based on selectedServerId instead of route
  const { server } = useServer(selectedServerId)
  const [channels] = useServerChannelsWithStatus(selectedServerId)
  const channelsSorted = getChannelsSorted(channels, server?.channelSort)

  // Update activeServer in userState when selection changes
  useEffect(() => {
    if (selectedServerId && selectedServerId !== activeServer) {
      updateUserState({
        activeServer: selectedServerId,
      })
    }
  }, [selectedServerId, activeServer])

  // Only sync with route serverId on initial mount or when activeServer is not set
  useEffect(() => {
    if (serverId && !activeServer) {
      setSelectedServerId(serverId)
    }
  }, [serverId, activeServer])

  // ensure theres always a selected channel
  useEffect(() => {
    if (!server) return
    if (!topServers) return
    if (!activeServer) return
    if (!channels[0]) return
    if (lastActiveChannel[server.id]) return
    updateUserState({
      lastActiveChannel: {
        ...lastActiveChannel,
        [server.id]: channels[0].id,
      },
    })
  }, [channels, server, activeServer, lastActiveChannel, topServers])

  // All channels are text channels
  const textChannels = [
    { id: selectedServerId, isMainChannel: true, name: 'Main' },
    ...channelsSorted,
  ] as ChannelWithRelations[]

  // Initialize header height with a default value
  const MIN_HEADER_HEIGHT = top + 100
  const DEFAULT_HEADER_HEIGHT = kHeight - 100 // Leave room for bottom sheet

  const headerHeight = useSharedValue(DEFAULT_HEADER_HEIGHT)

  return (
    <View flex={1}>
      <View
        flex={1}
        animation="medium"
        enterStyle={{
          opacity: 0,
        }}
        bg="$surface"
      >
        <Header
          topServers={topServers}
          selectedServerId={selectedServerId}
          setSelectedServerId={setSelectedServerId}
          server={server}
          textChannels={textChannels}
          headerHeight={headerHeight}
          minHeaderHeight={MIN_HEADER_HEIGHT}
        />
        <FriendBottomSheet />
      </View>
    </View>
  )
}
