import { Link, usePathname } from 'one'
import { useMedia, View } from 'tamagui'

import { Pressable } from '~/interface/buttons/Pressable'
import { HouseIcon } from '~/interface/icons/phosphor/HouseIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'
import { UserCircleIcon } from '~/interface/icons/phosphor/UserCircleIcon'
import { RovingTabs } from '~/interface/tabs/RovingTabs'

import type { Href } from 'one'
import type { TabsTabProps } from 'tamagui'

type TabRoute = {
  name: string
  href: Href
  icon: any
}

const routes: TabRoute[] = [
  { name: 'home', href: '/home' as Href, icon: HouseIcon },
  { name: 'plus', href: '/plus' as Href, icon: PlusIcon },
  { name: 'profile', href: '/profile' as Href, icon: UserCircleIcon },
]

export function NavigationTabs() {
  const pathname = usePathname()
  const media = useMedia()
  const iconSize = media.sm ? 24 : 20

  const currentTab =
    routes.find((r) => pathname.startsWith(r.href as string))?.name ?? 'home'

  return (
    <RovingTabs value={currentTab} indicatorStyle="underline">
      {({
        handleOnInteraction,
      }: {
        handleOnInteraction: TabsTabProps['onInteraction']
      }) =>
        routes.map((route) => {
          const Icon = route.icon

          return (
            <RovingTabs.Tab
              key={route.name}
              value={route.name}
              onInteraction={handleOnInteraction}
              px="$4"
              py="$2"
            >
              <Link href={route.href}>
                <View items="center" cursor="pointer">
                  <Pressable items="center">
                    <Icon size={iconSize} color="$color" />
                  </Pressable>
                </View>
              </Link>
            </RovingTabs.Tab>
          )
        })
      }
    </RovingTabs>
  )
}
