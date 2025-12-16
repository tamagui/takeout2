import { Link, usePathname } from 'one'
import { AnimatePresence, useMedia, View, XStack, YStack } from 'tamagui'

import { Pressable } from '~/interface/buttons/Pressable'
import { HouseIcon } from '~/interface/icons/phosphor/HouseIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'
import { UserCircleIcon } from '~/interface/icons/phosphor/UserCircleIcon'

import type { Href } from 'one'

type TabRoute = {
  name: string
  href: Href
  icon: any
}

const TAB_ITEM_WIDTH = 60

const routes: TabRoute[] = [
  { name: 'home', href: '/home' as Href, icon: HouseIcon },
  { name: 'plus', href: '/plus' as Href, icon: PlusIcon },
  { name: 'profile', href: '/profile' as Href, icon: UserCircleIcon },
]

export function NavigationTabs() {
  const pathname = usePathname()
  const media = useMedia()
  const iconSize = media.sm ? 24 : 20

  return (
    <XStack gap="$4" maxW={590} position="relative">
      {routes.map((route) => {
        const isActive = pathname === route.href
        const Icon = route.icon

        return (
          <Link key={route.name} href={route.href}>
            <YStack gap="$2" items="center" width={TAB_ITEM_WIDTH} cursor="pointer">
              <Pressable items="center">
                <Icon size={iconSize} color="$color" />
              </Pressable>
              {isActive && (
                <AnimatePresence>
                  <View
                    animation="medium"
                    theme="blue"
                    height={3}
                    width={TAB_ITEM_WIDTH / 2}
                    $sm={{ width: TAB_ITEM_WIDTH }}
                    bg="$color10"
                    rounded="$2"
                    enterStyle={{
                      opacity: 0,
                      scale: 0.9,
                    }}
                    exitStyle={{
                      opacity: 0,
                      scale: 0.9,
                    }}
                  />
                </AnimatePresence>
              )}
            </YStack>
          </Link>
        )
      })}
    </XStack>
  )
}
