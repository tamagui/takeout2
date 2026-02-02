import { useLogout } from '~/features/auth/useLogout'
import { useNotificationStatus } from '~/features/notification/useNotificationsStatus'
import { dialogConfirm } from '~/interface/dialogs/actions'
import { BellIcon } from '~/interface/icons/phosphor/BellIcon'
import { BookmarkIcon } from '~/interface/icons/phosphor/BookmarkIcon'
import { ChatCircleIcon } from '~/interface/icons/phosphor/ChatCircleIcon'
import { DoorIcon } from '~/interface/icons/phosphor/DoorIcon'
import { FileIcon } from '~/interface/icons/phosphor/FileIcon'
import { InfoIcon } from '~/interface/icons/phosphor/InfoIcon'
import { LockIcon } from '~/interface/icons/phosphor/LockIcon'
import { UserIcon } from '~/interface/icons/phosphor/UserIcon'
import { useToggleTheme } from '~/interface/theme/ThemeSwitch'

import type { Href } from 'one'
import type { IconComponent } from '~/interface/icons/types'

export interface SettingItem {
  id: string
  title: string
  icon?: IconComponent
  onPress?: () => void
  href?: Href
  external?: boolean
  toggle?: {
    value: boolean
    onValueChange: () => void
  }
}

export interface SettingSection {
  title: string
  items: SettingItem[]
}

export function useSettingsData() {
  const { logout } = useLogout()
  const {
    onPress: toggleTheme,
    Icon: ThemeIcon,
    setting: themeSetting,
  } = useToggleTheme()
  const { isToggleActive: notificationsEnabled, handleToggle: toggleNotifications } =
    useNotificationStatus()
  const themeLabel = themeSetting[0]?.toUpperCase() + themeSetting.slice(1)

  const handleDeleteAccount = async () => {
    await dialogConfirm({
      title: 'Delete Account',
      description: 'Account deletion is not currently available.',
    })
  }

  const sections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'theme',
          title: `Theme: ${themeLabel}`,
          icon: ThemeIcon,
          onPress: toggleTheme,
        },
        {
          id: 'notifications',
          title: 'Push Notifications',
          icon: BellIcon,
          toggle: {
            value: notificationsEnabled,
            onValueChange: toggleNotifications,
          },
        },
        {
          id: 'profile',
          title: 'Edit Profile',
          icon: UserIcon,
          href: '/home/settings/edit-profile',
        },
        {
          id: 'blocked-users',
          title: 'Blocked Users',
          icon: LockIcon,
          href: '/home/settings/blocked-users',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          icon: ChatCircleIcon,
          href: '/help',
          external: true,
        },
        {
          id: 'documentation',
          title: 'Documentation',
          icon: BookmarkIcon,
          href: '/docs/introduction',
          external: true,
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: FileIcon,
          href: '/terms-of-service',
          external: true,
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: LockIcon,
          href: '/privacy-policy',
          external: true,
        },
        {
          id: 'delete',
          title: 'Delete Account',
          icon: InfoIcon,
          onPress: handleDeleteAccount,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          id: 'logout',
          title: 'Log Out',
          icon: DoorIcon,
          onPress: logout,
        },
      ],
    },
  ]

  return { sections, themeLabel }
}
