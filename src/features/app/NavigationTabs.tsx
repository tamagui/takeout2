import { Link, usePathname } from 'one'
import { useMedia, View } from 'tamagui'

import { Pressable } from '~/interface/buttons/Pressable'
import { dialogEmit } from '~/interface/dialogs/shared'
import { HouseIcon } from '~/interface/icons/phosphor/HouseIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'
import { UserCircleIcon } from '~/interface/icons/phosphor/UserCircleIcon'
import { RovingTabs } from '~/interface/tabs/RovingTabs'

import type { Href } from 'one'
import type { TabsTabProps } from 'tamagui'

type TabRoute = {
  name: string
  href?: Href
  icon: any
  action?: () => void
}

const routes: TabRoute[] = [
  { name: 'home', href: '/home/feed', icon: HouseIcon },
  { name: 'plus', icon: PlusIcon, action: () => dialogEmit({ type: 'create-post' }) },
  { name: 'profile', href: '/home/profile', icon: UserCircleIcon },
]

export function NavigationTabs() {
  const pathname = usePathname()
  const media = useMedia()
  const iconSize = media.sm ? 24 : 20

  const currentTab =
    routes.find((r) => r.href && pathname.startsWith(r.href as string))?.name ?? 'home'

  return (
    <RovingTabs value={currentTab} indicatorStyle="underline">
      {({
        handleOnInteraction,
      }: {
        handleOnInteraction: TabsTabProps['onInteraction']
      }) =>
        routes.map((route) => {
          const Icon = route.icon
          const content = (
            <View items="center" cursor="pointer">
              <Pressable items="center">
                <Icon size={iconSize} color="$color" />
              </Pressable>
            </View>
          )

          return (
            <RovingTabs.Tab
              key={route.name}
              value={route.name}
              onInteraction={handleOnInteraction}
              px="$4"
              py="$2"
            >
              {route.href ? (
                <Link href={route.href}>{content}</Link>
              ) : (
                <Pressable onPress={route.action} data-testid="create-post-button">
                  {content}
                </Pressable>
              )}
            </RovingTabs.Tab>
          )
        })
      }
    </RovingTabs>
  )
}
