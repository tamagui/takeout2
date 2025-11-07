import { router, type Href } from 'one'
import { Alert, Linking } from 'react-native'
import { ScrollView, SizableText, View, XStack, YStack } from 'tamagui'
import { APP_NAME_LOWERCASE, HELP_ROADMAP_URL } from '~/constants/app'
import { authClient, clearAuthClientToken } from '~/features/auth/client/authClient'
import { useUser } from '~/features/user/useUser'
import { getHumanReadableVersionString } from '~/helpers/getHumanReadableVersionString'
import { Pressable } from '~/interface/buttons/Pressable'
import { showError } from '~/interface/dialogs/actions'
import { Switch } from '~/interface/forms/Switch'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'
import { ChatCircleIcon } from '~/interface/icons/phosphor/ChatCircleIcon'
import { DoorIcon } from '~/interface/icons/phosphor/DoorIcon'
import { FileIcon } from '~/interface/icons/phosphor/FileIcon'
import { InfoIcon } from '~/interface/icons/phosphor/InfoIcon'
import { LockIcon } from '~/interface/icons/phosphor/LockIcon'
import { ShieldCheckIcon } from '~/interface/icons/phosphor/ShieldCheckIcon'
import { ShootingStarIcon } from '~/interface/icons/phosphor/ShootingStarIcon'
import { UserIcon } from '~/interface/icons/phosphor/UserIcon'
import { Image } from '~/interface/image/Image'
import { RepeatedTapToShowDevTools } from '~/interface/interactions/RepeatedTapToShowDevTools'
import { H4 } from '~/interface/text/Headings'

interface SettingItem {
  id: string
  title: string
  icon?: React.ComponentType<any>
  action?: () => void
  route?: Href
  url?: string
  hasSwitch?: boolean
}

interface SettingSection {
  title: string
  items: SettingItem[]
}

export const ProfileSettingsPage = () => {
  const { isAdmin } = useUser()

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
              showError(error, 'Logout')
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Account deletion is not currently available.', [
      { text: 'OK' },
    ])
  }

  const allSections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile',
          icon: UserIcon,
          route: '/setting/edit-profile',
        },
        {
          id: 'blocked-users',
          title: 'Blocked Users',
          icon: ShieldCheckIcon,
          route: '/setting/blocked-users',
        },
      ],
    },
    {
      title: 'Support and more',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          icon: ChatCircleIcon,
          route: '/help',
        },
        {
          id: 'request-feature',
          title: 'Request Feature',
          icon: ShootingStarIcon,
          url: HELP_ROADMAP_URL,
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: FileIcon,
          route: '/terms-of-service',
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: LockIcon,
          route: '/privacy-policy',
        },
        {
          id: 'delete',
          title: 'Delete Account',
          icon: InfoIcon,
          action: handleDeleteAccount,
        },
      ],
    },
    // TODO
    // ...(isAdmin
    //   ? [
    //       {
    //         title: 'Admin',
    //         items: [
    //           {
    //             id: 'admin',
    //             title: 'Admin Panel',
    //             icon: GearIcon,
    //             route: '/admin',
    //           },
    //           {
    //             id: 'whitelist',
    //             title: 'Manage Whitelist',
    //             icon: ShieldCheckIcon,
    //             route: '/admin/whitelist',
    //           },
    //           {
    //             id: 'user-reports',
    //             title: 'User Reports',
    //             icon: ShieldCheckIcon,
    //             route: '/admin/user-reports',
    //           },
    //         ],
    //       },
    //     ]
    //   : []),
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

  const handleItemPress = (item: SettingItem) => {
    if (item.action) {
      item.action()
    } else if (item.url) {
      Linking.openURL(item.url).catch((error) => {
        showError(error, 'Open Link')
      })
    } else if (item.route) {
      router.push(item.route)
    }
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
            <SizableText size="$4" color="$color12" fontWeight="600">
              {item.title}
            </SizableText>
          </XStack>
          <Switch size="$3" checked={false} onCheckedChange={undefined} bg="$color4" />
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
    <ScrollView
      flex={1}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <YStack flex={1} pb="$10">
        {allSections.map((section, sectionIndex) => (
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
  )
}

function LogoAndVersion() {
  return (
    <RepeatedTapToShowDevTools>
      {({ handleTap, tapsRemaining }) => (
        <YStack items="center" pb={100} pt="$4" onPress={handleTap}>
          <XStack items="center" gap="$2">
            <Image
              src={require('../../../assets/logo.png')}
              width={16}
              height={16}
              objectFit="contain"
              tintColor="white"
            />
            <H4 color="$color8" fontWeight="600">
              {APP_NAME_LOWERCASE}
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
