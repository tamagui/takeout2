import { Check, DoorOpen } from '@tamagui/lucide-icons'
import { ToolTipPopoverView, configureTips, resetTips } from 'expo-ios-popover-tip'
import { useLinkTo } from 'one'
import { useCallback, useEffect, useState } from 'react'
import { Alert, StyleSheet, TouchableOpacity } from 'react-native'
import { View, XStack } from 'tamagui'
import { isAndroid, isIos } from '@vxrn/helpers'
import { authClient } from '~/auth/client/authClient'
import { toggleJoinServer } from '~/features/user/useJoinServer'
import { useUser } from '~/features/user/useUser'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { ListItem, type ListItemProps } from '~/interface/lists/ListItem'
import { getSimpleSize } from '~/interface/sizes'
import { GlassView } from '~/interface/view/GlassView'
import type { ServerWithMembership } from '~/data/types'

// Track which servers have shown the tooltip
const shownTooltipsForServers = new Set<string>()

export const ServerListItem = ({
  server,
  link,
  size,
  ...props
}: ListItemProps & { link?: boolean; server: ServerWithMembership }) => {
  const hasJoined = !!server.member
  const { user } = useUser()
  const [showTip, setShowTip] = useState(false)
  const [tipsConfigured, setTipsConfigured] = useState(false)

  // Initialize tips on mount
  useEffect(() => {
    const initializeTips = async () => {
      await resetTips()
      await configureTips()
      setTipsConfigured(true)
    }

    if (!tipsConfigured) {
      initializeTips()
    }
  }, [tipsConfigured])

  const openGithubLogin = useCallback(() => {
    console.info('openGithubLogin')
    authClient.signIn.social({
      provider: 'github',
      callbackURL: '/auth',
    })
  }, [])

  const showAndroidAuthAlert = () => {
    Alert.alert('Sign in Required', 'You need to sign in with GitHub to join servers', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Login with GitHub', onPress: openGithubLogin },
    ])
  }

  const handleJoinPress = (e: any) => {
    if (!user) {
      if (isAndroid) {
        // Android: Always show alert
        showAndroidAuthAlert()
      } else if (isIos) {
        // iOS: Show tooltip once per server, then open login directly
        if (shownTooltipsForServers.has(server.id)) {
          // Already shown tooltip for this server, open login directly
          openGithubLogin()
        } else {
          // First time for this server, show tooltip
          setShowTip(true)
          shownTooltipsForServers.add(server.id)
          console.info('shownTooltipsForServers', server.id)
        }
      }
    } else {
      // User is logged in, join the server
      toggleJoinServer(server, e)
    }
  }

  const handleTooltipAction = () => {
    openGithubLogin()
    setShowTip(false) // Dismiss tooltip after action
  }

  const handleTooltipDismiss = () => {
    setShowTip(false)
  }

  const shouldShowTooltip = !user && !hasJoined && isIos && showTip && tipsConfigured

  const joinButton = shouldShowTooltip ? (
    <ToolTipPopoverView
      tooltip={{
        id: `auth_tip_${server.id}`,
        title: { text: 'Sign in Required' },
        description: { text: 'You need to sign in with GitHub to join servers' },
        actions: [{ id: 'github', title: 'Login with GitHub' }],
      }}
      onActionPress={handleTooltipAction}
      onTipDismiss={handleTooltipDismiss}
    >
      <JoinButton size={size} hasJoined={hasJoined} onPress={handleJoinPress} />
    </ToolTipPopoverView>
  ) : (
    <JoinButton size={size} hasJoined={hasJoined} onPress={handleJoinPress} />
  )

  const listContent = (
    <>
      <Avatar size={Math.round(getSimpleSize(size) * 0.9)} image={server.icon} />
      <ListItem.Text flex={1} numberOfLines={1} fontSize="$4" fontWeight="600">
        {server.name}
      </ListItem.Text>
      <XStack flex={1} />
      {typeof hasJoined === 'boolean' && joinButton}
    </>
  )

  const linkProps = useLinkTo({ href: `/${server.id}` })

  const handleListItemPress = useCallback(
    (e: any) => {
      if (link && linkProps.onPress) {
        linkProps.onPress(e)
      }
    },
    [link, linkProps]
  )

  return (
    <>
      {isIos ? (
        <GlassView borderRadius={16}>
          <View>
            <ListItem
              size={size}
              {...props}
              bg="transparent"
              borderWidth={0}
              py="$3"
              px="$3"
              onPress={link ? handleListItemPress : undefined}
            >
              {listContent}
            </ListItem>
          </View>
        </GlassView>
      ) : (
        // android: simple list with subtle elevation
        <ListItem
          size={size}
          {...props}
          bg="$color2"
          borderWidth={0}
          rounded="$4"
          py="$3"
          px="$3"
          elevation={2}
          shadowColor="$shadowColor"
          shadowOffset={{ height: 2, width: 0 }}
          shadowOpacity={0.08}
          shadowRadius={3}
          onPress={link ? handleListItemPress : undefined}
        >
          {listContent}
        </ListItem>
      )}
    </>
  )
}

const JoinButton = ({
  size,
  hasJoined,
  onPress,
}: {
  size: any
  hasJoined: boolean
  onPress: (e: any) => void
}) => (
  <>
    {/* Test: Add DialogConfirm here to see if it renders without error */}
    {/* <DialogConfirm /> */}
    {hasJoined ? (
      <TouchableOpacity onPress={onPress} hitSlop={10}>
        <Check size={16} color="$color02" />
      </TouchableOpacity>
    ) : (
      <ButtonSimple variant="transparent" size={size} onPress={onPress} icon={DoorOpen}>
        <ButtonSimple.Text fontWeight="600" text="center">
          {size === 'small' || hasJoined ? 'Joined' : 'Join'}
        </ButtonSimple.Text>
      </ButtonSimple>
    )}
  </>
)
