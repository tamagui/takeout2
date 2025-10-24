import { memo } from 'react'
import { YStack } from 'tamagui'
import { useCurrentAppInstallId } from '~/context/CurrentAppInstallContext'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import { getAppLink } from '~/features/apps/getAppLink'
import { useQuery, zero } from '~/zero/client'
import type { AppInstallWithRelations } from '~/data/types'
import { Link } from '../app/Link'
import { ListItem } from '../lists/ListItem'
import { ListTitle } from '../lists/ListTitle'

export const SidebarApps = memo(() => {
  const serverId = useCurrentServerId()
  const [allAppInstalls] = useQuery(
    zero.query.appInstall.where('serverId', serverId).related('app', (q) => q.one())
  )

  if (!serverId) {
    return null
  }

  // only apps with UI
  const appInstalls = (allAppInstalls || []).filter((app) => !!app.app?.meta?.hasFrontend)

  if (!appInstalls.length) {
    return null
  }

  return (
    <YStack
      {...(!!true && {
        mt: 15,
      })}
    >
      <ListTitle>
        <ListTitle.Text>Apps</ListTitle.Text>
      </ListTitle>
      {appInstalls.map((appInstall) => {
        if (!appInstall.app) {
          return null
        }
        return <AppListItem key={appInstall.id} appInstall={appInstall} />
      })}
    </YStack>
  )
})

const AppListItem = ({ appInstall }: { appInstall: AppInstallWithRelations }) => {
  const appInstallId = useCurrentAppInstallId() // todo could avoid re-renders more granularly
  const { app } = appInstall

  return (
    <Link href={getAppLink(appInstall)}>
      <ListItem
        size="small"
        variant="sidebar"
        active={Boolean(appInstallId && appInstallId === appInstall.id)}
      >
        <ListItem.Text>{app?.name || 'No name'}</ListItem.Text>
      </ListItem>
    </Link>
  )
}
