import {
  Home as HouseIcon,
  Plus as PlusIcon,
  User as UserIcon,
} from '@tamagui/lucide-icons'
import type { Href } from 'one'
import { Link, usePathname } from 'one'
import { AnimatePresence, View, XStack, YStack } from 'tamagui'
import { Pressable } from '~/interface/buttons/Pressable'

type TabRoute = {
  name: string
  href: Href
  icon: any
}

const TAB_ITEM_WIDTH = 60

const routes: TabRoute[] = [
  { name: 'home', href: '/home' as Href, icon: HouseIcon },
  { name: 'plus', href: '/plus' as Href, icon: PlusIcon },
  { name: 'profile', href: '/profile' as Href, icon: UserIcon },
]

export function NavigationTabs() {
  const pathname = usePathname()

  return (
    <XStack gap="$4" maxW={590} position="relative">
      {routes.map((route) => {
        const isActive = pathname === route.href
        const Icon = route.icon

        return (
          <Link key={route.name} href={route.href}>
            <YStack gap="$2" items="center" width={TAB_ITEM_WIDTH} cursor="pointer">
              <Pressable items="center">
                <Icon size={24} color="$color" />
              </Pressable>
              {isActive && (
                <AnimatePresence>
                  <View
                    animation="medium"
                    theme="blue"
                    height={3}
                    width={TAB_ITEM_WIDTH}
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
