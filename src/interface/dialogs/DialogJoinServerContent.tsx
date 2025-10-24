import { useEffect, useRef, useState } from 'react'
import { ScrollView, YStack } from 'tamagui'
import { navigateToServer } from '~/features/server/actions/navigateToServer'
import { ServerListItem } from '~/features/server/ui/ServerListItem'
import { useUser } from '~/features/user/useUser'
import { useQuery, zero } from '~/zero/client'
import type { ServerWithMembership } from '~/data/types'
import { SearchableInput, useSearchableList } from '../searchable-list'
import { useSearchableListItem } from '../searchable-list/useSearchableListItem'
import { AlwaysVisibleTabContent } from './AlwaysVisibleTabContent'
import type { TabContentPaneProps } from './types'
import { dialogEmit } from './shared'

export const DialogJoinServerContent = ({ setShow, ...props }: TabContentPaneProps) => {
  const isActive = props.active === props.value
  const inputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const { user } = useUser()

  const [foundServers] = useQuery(
    (() => {
      let query = zero.query.server
        .where('isPrivateChat', false)
        .where('userId', 'IS', null)
        .limit(10)

      if (user) {
        query = query.related('member', (q) => q.where('id', user?.id || '').one())
      }

      if (search) {
        query = query.where('name', 'ILIKE', `%${search}%`)
      }
      return query
    })(),
    {
      enabled: true,
    }
  )

  const { Provider, handle } = useSearchableList({
    onSelectItem: (server) => {
      dialogEmit({ type: 'closed' })
      setTimeout(() => {
        navigateToServer(server)
      }, 50)
    },
    items: foundServers,
  })

  useEffect(() => {
    if (isActive) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 40)
    }
  }, [isActive])

  return (
    <AlwaysVisibleTabContent gap="$3" {...props}>
      <Provider handle={handle}>
        <SearchableInput
          mb="$1"
          ref={inputRef as any}
          size="$3"
          onChangeText={setSearch}
        />

        <ScrollView>
          <YStack>
            {foundServers.map((server, index) => {
              return <JoinServerListItem key={server.id} server={server} index={index} />
            })}
          </YStack>
        </ScrollView>
      </Provider>
    </AlwaysVisibleTabContent>
  )
}

const JoinServerListItem = ({
  server,
  index,
}: {
  server: ServerWithMembership
  index: number
}) => {
  const { active, itemProps, key } = useSearchableListItem(index)

  return <ServerListItem link key={key} active={active} {...itemProps} server={server} />
}
