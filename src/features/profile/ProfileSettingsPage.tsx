import { router } from 'one'
import { Alert, Linking } from 'react-native'
import { ScrollView, SizableText, View, XStack, YStack } from 'tamagui'
import { authClient, clearAuthClientToken } from '~/auth/client/authClient'
import { FEATURE_FLAGS } from '~/features/feature-flags'
import { useNotificationStatus } from '~/features/push-notifications/useNotificationsStatus'
import { useUser } from '~/features/user/useUser'
import { useUserDelete } from '~/features/user/useUserDelete'
import { getHumanReadableVersionString } from '~/helpers/getHumanReadableVersionString'
import { Pressable } from '~/interface/buttons/Pressable'
import { Switch } from '~/interface/forms/Switch'
import { BasicHeader } from '~/interface/headers/BasicHeader'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'
import { ChatCircleIcon } from '~/interface/icons/phosphor/ChatCircleIcon'
import { DoorIcon } from '~/interface/icons/phosphor/DoorIcon'
import { FileIcon } from '~/interface/icons/phosphor/FileIcon'
import { GearIcon } from '~/interface/icons/phosphor/GearIcon'
import { InfoIcon } from '~/interface/icons/phosphor/InfoIcon'
import { LockIcon } from '~/interface/icons/phosphor/LockIcon'
import { ShieldCheckIcon } from '~/interface/icons/phosphor/ShieldCheckIcon'
import { ShootingStarIcon } from '~/interface/icons/phosphor/ShootingStarIcon'
import { UserIcon } from '~/interface/icons/phosphor/UserIcon'
import { WalletIcon } from '~/interface/icons/phosphor/WalletIcon'
import { Image } from '~/interface/image/Image'
import { RepeatedTapToShowDevTools } from '~/interface/interactions/RepeatedTapToShowDevTools'
import { H4 } from '~/interface/text/Headings'
import { showToast } from '~/interface/toast/helpers'
import { useStatsigClient } from '~/features/feature-flags/usePostHog'

interface SettingItem {
  id: string
  title: string
  icon?: React.ComponentType<any>
  action?: () => void
  route?: string
  url?: string
  hasSwitch?: boolean
}

interface SettingSection {
  title: string
  items: SettingItem[]
}

export const ProfileSettingsPage = () => {
  const { client } = useStatsigClient()
  const showWallet = client.checkGate(FEATURE_FLAGS.PROFILE_ENABLE_WALLET)
  const { isToggleActive: notificationsEnabled, handleToggle } = useNotificationStatus()
  const { confirmDeleteAccount } = useUserDelete()
  const { userRole } = useUser({ includeRole: true })

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authClient.signOut()
              clearAuthClientToken()
              router.replace('/login')
            } catch (error) {
              console.error('Logout error:', error)
              showToast('Failed to log out', { type: 'error' })
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  const handleDeleteAccount = () => {
    confirmDeleteAccount()
  }

  const allSections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        // {
        //   id: 'notifications',
        //   title: 'Notifications',
        //   icon: BellIcon,
        //   hasSwitch: true,
        // },
        {
          id: 'profile',
          title: 'Profile',
          icon: UserIcon,
          route: '/user/profile-edit',
        },
        {
          id: 'blocked-users',
          title: 'Blocked Users',
          icon: ShieldCheckIcon,
          route: '/user/profile-blocked-users',
        },
        // {
        //   id: 'preferences',
        //   title: 'Preferences',
        //   icon: ListDashesIcon,
        //   route: '/settings/preferences',
        // },
      ],
    },
    {
      title: 'Wallet',
      items: [
        {
          id: 'export',
          title: 'Export Wallet',
          icon: WalletIcon,
          route: '/settings/export-wallet',
        },
      ],
    },
    {
      title: 'Support and more',
      items: [
        {
          id: 'get-help',
          title: 'Get Help',
          icon: ChatCircleIcon,
          url: 'https://help.fleek.xyz/requests',
        },
        {
          id: 'request-feature',
          title: 'Request Feature',
          icon: ShootingStarIcon,
          url: 'https://help.fleek.xyz/roadmap',
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: FileIcon,
          url: 'https://fleek.xyz/terms-and-services',
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: LockIcon,
          url: 'https://fleek.xyz/privacy-policy',
        },
        {
          id: 'delete',
          title: 'Delete Account',
          icon: InfoIcon,
          action: handleDeleteAccount,
        },
      ],
    },
    ...(userRole === 'admin'
      ? [
          {
            title: 'Admin',
            items: [
              {
                id: 'admin',
                title: 'Admin Panel',
                icon: GearIcon,
                route: '/admin',
              },
              {
                id: 'whitelist',
                title: 'Manage Whitelist',
                icon: ShieldCheckIcon,
                route: '/admin/whitelist',
              },
              {
                id: 'user-reports',
                title: 'User Reports',
                icon: ShieldCheckIcon,
                route: '/admin/user-reports',
              },
            ],
          },
        ]
      : []),
    {
      title: 'Other',
      items: [
        {
          id: 'logout',
          title: 'Log Out',
          icon: DoorIcon,
          action: handleLogout,
        },
      ],
    },
  ]

  // Filter sections based on feature flags
  const sections = showWallet
    ? allSections
    : allSections.filter((section) => section.title !== 'Wallet')

  const handleItemPress = (item: SettingItem) => {
    if (item.action) {
      item.action()
    } else if (item.url) {
      Linking.openURL(item.url).catch(() => {
        showToast('Failed to open link', { type: 'error' })
      })
    } else if (item.route) {
      router.push(item.route)
    }
  }

  const handleNotificationToggle = (value: boolean) => {
    handleToggle(
      () => {
        // onGranted callback - notifications were successfully enabled/disabled
      },
      {
        isForSetting: !value, // If turning off, open settings
      }
    )
  }

  const renderItem = (item: SettingItem) => {
    const Icon = item.icon

    if (item.hasSwitch) {
      return (
        <XStack
          key={item.id}
          bg="$color1"
          height={56}
          px="$4"
          items="center"
          justify="space-between"
          borderBottomWidth={1}
          borderBottomColor="$color3"
        >
          <XStack gap="$3" items="center" flex={1}>
            {Icon && (
              <View width={24} items="center" justify="center">
                <Icon size={20} color="$color11" />
              </View>
            )}
            <SizableText size="$4" color="$color12">
              {item.title}
            </SizableText>
          </XStack>
          <Switch
            size="$3"
            checked={item.id === 'notifications' ? notificationsEnabled : false}
            onCheckedChange={
              item.id === 'notifications' ? handleNotificationToggle : undefined
            }
            bg={notificationsEnabled ? '$green9' : '$color4'}
          />
        </XStack>
      )
    }

    return (
      <Pressable key={item.id} onPress={() => handleItemPress(item)}>
        <XStack
          bg="$color1"
          height={56}
          px="$4"
          items="center"
          justify="space-between"
          borderBottomWidth={1}
          borderBottomColor="$color3"
        >
          <XStack gap="$3" items="center" flex={1}>
            {Icon && (
              <View width={24} items="center" justify="center">
                <Icon size={20} color="$color11" />
              </View>
            )}
            <SizableText size="$4" color="$color12">
              {item.title}
            </SizableText>
          </XStack>
          <CaretRightIcon size={20} color="$color8" />
        </XStack>
      </Pressable>
    )
  }

  return (
    <YStack flex={1} bg="$background">
      <BasicHeader title="Settings" BackIcon={CaretLeftIcon} />

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack flex={1} pb="$10">
          {sections.map((section, sectionIndex) => (
            <YStack key={section.title} mb="$6">
              <SizableText
                size="$2"
                color="$color10"
                px="$4"
                py="$2"
                textTransform="uppercase"
                fontWeight="600"
              >
                {section.title}
              </SizableText>
              <YStack bg="$color1" borderTopWidth={1} borderTopColor="$color3">
                {section.items.map((item) => renderItem(item))}
              </YStack>
            </YStack>
          ))}

          <LogoAndVersion />
        </YStack>
      </ScrollView>
    </YStack>
  )
}

function LogoAndVersion() {
  return (
    <RepeatedTapToShowDevTools>
      {({ handleTap, tapsRemaining }) => (
        <YStack items="center" pb={100} pt="$4" onPress={handleTap}>
          <XStack>
            <Image
              src={require('../../../assets/apps/logo-white.png')}
              width={20}
              height={24}
              objectFit="contain"
              tintColor="grey"
            />
            <H4 color="$color8" fontWeight="600">
              fleek
            </H4>
          </XStack>
          <SizableText size="$1" color="$color8" mt="$2">
            {tapsRemaining <= 8 ? `${tapsRemaining}... ` : ''}
            {getHumanReadableVersionString()}
          </SizableText>
        </YStack>
      )}
    </RepeatedTapToShowDevTools>
  )
}
