import { memo } from 'react'
import { usePathname } from 'one'
import { YStack } from 'tamagui'
import { UserListItem } from '~/features/user/ui/UserListItem'
import { useUser } from '~/features/user/useUser'
import { Link } from '../app/Link'
import { getUserProfileLink } from '~/features/user/getUserProfileLink'

export const SidebarHome = memo(() => {
  const pathname = usePathname()
  const isHome = pathname === '/' || pathname.startsWith('/user/')
  return isHome ? <SidebarHomeContent /> : null
})

const SidebarHomeContent = memo(() => {
  const { user } = useUser()

  if (!user) {
    return null
  }

  return (
    <YStack>
      <Link href={getUserProfileLink(user)}>
        <UserListItem variant="sidebar" size="large" fontFamily="$mono" user={user} />
      </Link>
    </YStack>
  )
})
