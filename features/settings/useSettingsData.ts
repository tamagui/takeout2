import { openFeedback } from 'takeout-native/feedback'
import {
  APP_SETTINGS_EDIT_PROFILE_HREF,
  APP_SETTINGS_NOTIFICATIONS_HREF,
} from '~/features/app/routes'
import { useLogout } from '~/features/auth/useLogout'
import { useFeedbackSetting } from '~/features/feedback/feedbackSetting'
import { useHasUnreadNotifications } from '~/features/notifications/useNotificationInbox'
import { Icons } from '~/interface/icons'
import type { NavigationRowProps } from 'takeout-ui/forms/formContract'
import type { Icon } from 'takeout-ui/icons/types'
import type { Href } from 'one'

export type SettingItem = {
  id: string
  title: string
  // the web rows draw the app's icon; the native rows take an SF Symbol.
  icon?: Icon
  systemImage?: NavigationRowProps['systemImage']
  onPress?: () => void
  // a press row that ends something (log out), drawn in the destructive role.
  destructive?: boolean
  // a low-noise unread mark. it carries no count, so the row never becomes a
  // number the user has to reconcile.
  showsUnreadDot?: boolean
  // a row the user switches in place rather than a row that navigates.
  toggle?: {
    checked: boolean
    onCheckedChange: (next: boolean) => void
  }
} & ({ external: true; href: string } | { external?: false; href?: Href })

export type SettingSection = {
  title: string
  items: SettingItem[]
}

export function useSettingsData() {
  const { logout } = useLogout()
  const hasUnreadNotifications = useHasUnreadNotifications()
  const feedback = useFeedbackSetting()

  const sections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Edit Profile',
          icon: Icons.Profile,
          systemImage: 'person',
          href: APP_SETTINGS_EDIT_PROFILE_HREF,
        },
        {
          id: 'notifications',
          title: 'Notifications',
          icon: Icons.Notifications,
          systemImage: 'bell',
          href: APP_SETTINGS_NOTIFICATIONS_HREF,
          showsUnreadDot: hasUnreadNotifications,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'give-feedback',
          title: 'Give feedback',
          icon: Icons.Feedback,
          systemImage: 'bubble.left',
          // opens the feedback overlay over whatever the user was last
          // looking at. it is the visible alternative to three fingers down.
          onPress: () => {
            openFeedback()
          },
        },
        {
          id: 'feedback-enabled',
          title: 'In-app feedback',
          icon: Icons.Feedback,
          // availability only. turning it off makes the row above inert; it
          // never changes what is sent, because nothing is captured or sent
          // until the user presses Send.
          toggle: {
            checked: feedback.enabled,
            onCheckedChange: feedback.setEnabled,
          },
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: Icons.Terms,
          systemImage: 'doc.text',
          external: true,
          href: '/terms-of-service',
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: Icons.Privacy,
          systemImage: 'lock',
          external: true,
          href: '/privacy-policy',
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          id: 'logout',
          title: 'Log Out',
          icon: Icons.SignOut,
          onPress: logout,
          destructive: true,
        },
      ],
    },
  ]

  return { sections }
}
