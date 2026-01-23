import { usePathname, type Href } from 'one'
import { View, XStack } from 'tamagui'

import { Link } from '~/interface/app/Link'
import { HouseIcon } from '~/interface/icons/phosphor/HouseIcon'
import { SparkleIcon } from '~/interface/icons/phosphor/SparkleIcon'
import { UserCircleIcon } from '~/interface/icons/phosphor/UserCircleIcon'

type TabRoute = {
  name: string
  href: Href
  icon: any
}

const routes: TabRoute[] = [
  { name: 'home', href: '/home/feed', icon: HouseIcon },
  { name: 'ai', href: '/home/ai', icon: SparkleIcon },
  { name: 'profile', href: '/home/profile', icon: UserCircleIcon },
]

export function BottomTabBar() {
  const pathname = usePathname()
  const currentTab =
    routes.find((r) => r.href && pathname.startsWith(r.href as string))?.name ?? 'home'

  return (
    <View
      position="fixed"
      b={0}
      l={0}
      r={0}
      bg="$background08"
      boxShadow="0 0 10px $shadow4"
      display="flex"
      $lg={{ display: 'none' }}
      z={100}
      style={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <XStack justify="space-around" height={60} items="center" px="$4">
        {routes.map((route) => {
          const Icon = route.icon
          const isActive = currentTab === route.name

          return (
            <Link key={route.name} href={route.href} items="center" p="$2" rounded="$4">
              <Icon size={24} />
            </Link>
          )
        })}
      </XStack>
    </View>
  )
}
