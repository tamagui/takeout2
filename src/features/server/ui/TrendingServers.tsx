import { memo } from 'react'
import { YStack } from 'tamagui'
import { useUser } from '~/features/user/useUser'
import { useQuery, zero } from '~/zero/client'
import { ServerListItem } from './ServerListItem'

export const TrendingServers = memo(() => {
  const { user } = useUser()
  const [topServers] = useQuery(
    (() => {
      let query = zero.query.server.where('userId', 'IS', null).limit(20)

      if (user?.id) {
        query = query.related('member', (q) => q.where('id', user.id).one())
      }

      return query
    })()
  )

  return (
    <YStack data-testid="trending-servers">
      {topServers.map((server) => {
        return <ServerListItem link server={server} key={server.id} />
      })}
    </YStack>
  )
})
