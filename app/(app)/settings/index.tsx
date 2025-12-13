import { Link, type Href } from 'one'
import { ScrollView, SizableText, View, XStack, YStack } from 'tamagui'

import { APP_NAME_LOWERCASE } from '~/constants/app'
import { useLogout } from '~/features/auth/useLogout'
import { useUser } from '~/features/user/useUser'
import { Pressable } from '~/interface/buttons/Pressable'
import { dialogConfirm } from '~/interface/dialogs/actions'
import { Switch } from '~/interface/forms/Switch'
import { BookmarkIcon } from '~/interface/icons/phosphor/BookmarkIcon'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'
import { ChatCircleIcon } from '~/interface/icons/phosphor/ChatCircleIcon'
import { DoorIcon } from '~/interface/icons/phosphor/DoorIcon'
import { FileIcon } from '~/interface/icons/phosphor/FileIcon'
import { InfoIcon } from '~/interface/icons/phosphor/InfoIcon'
import { LockIcon } from '~/interface/icons/phosphor/LockIcon'
import { UserIcon } from '~/interface/icons/phosphor/UserIcon'
import { H4, SepHeading } from '~/interface/text/Headings'

interface SettingItem {
  id: string
  title: string
  icon?: React.ComponentType<any>
  action?: () => void
  href?: Href
  external?: boolean
  hasSwitch?: boolean
}

interface SettingSection {
  title: string
  items: SettingItem[]
}

const ItemContent = ({ item }: { item: SettingItem }) => {
  const Icon = item.icon
  return (
    <XStack
      cursor="pointer"
      height={56}
      px="$4"
      items="center"
      justify="space-between"
      hoverStyle={{
        bg: '$color1pt5',
      }}
    >
      <XStack gap="$3" items="center" flex={1}>
        {Icon && (
          <View width={24} items="center" justify="center">
            <Icon size={20} color="$color11" />
          </View>
        )}
        <SizableText size="$5">{item.title}</SizableText>
      </XStack>
      <CaretRightIcon size={16} color="$color8" />
    </XStack>
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
          <SizableText size="$4" color="$color12" fontWeight="600">
            {item.title}
          </SizableText>
        </XStack>
        <Switch size="$3" checked={false} onCheckedChange={undefined} bg="$color4" />
      </XStack>
    )
  }

  if (item.action) {
    return (
      <Pressable key={item.id} onPress={item.action}>
        <ItemContent item={item} />
      </Pressable>
    )
  }

  if (item.href) {
    return (
      <Link key={item.id} href={item.href} target={item.external ? '_blank' : undefined}>
        <ItemContent item={item} />
      </Link>
    )
  }

  return null
}

export const ProfileSettingsPage = () => {
  const { isAdmin } = useUser()
  const { logout } = useLogout()

  const handleDeleteAccount = async () => {
    await dialogConfirm({
      title: 'Delete Account',
      description: 'Account deletion is not currently available.',
    })
  }

  const allSections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile',
          icon: UserIcon,
          href: '/settings/edit-profile',
        },
        {
          id: 'blocked-users',
          title: 'Blocked Users',
          icon: LockIcon,
          href: '/settings/blocked-users',
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
          href: '/help',
        },
        {
          id: 'documentation',
          title: 'Documentation',
          icon: BookmarkIcon,
          href: '/docs',
          external: true,
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: FileIcon,
          href: '/terms-of-service',
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: LockIcon,
          href: '/privacy-policy',
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
          action: logout,
        },
      ],
    },
  ]

  return (
    <ScrollView
      flex={1}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <YStack flex={1} pb="$10">
        {allSections.map((section, sectionIndex) => (
          <YStack key={section.title} mb="$6">
            <SepHeading>{section.title}</SepHeading>
            <YStack>{section.items.map((item) => renderItem(item))}</YStack>
          </YStack>
        ))}

        <LogoAndVersion />
      </YStack>
    </ScrollView>
  )
}

function LogoAndVersion() {
  return (
    <YStack items="center" pb={100} pt="$4">
      <XStack items="center" gap="$2">
        <H4 color="$color8" fontWeight="600">
          {APP_NAME_LOWERCASE}
        </H4>
      </XStack>
      <SizableText size="$1" color="$color8" mt="$2">
        v1.0.0
      </SizableText>
    </YStack>
  )
}
