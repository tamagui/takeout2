import { useZero } from '@rocicorp/zero/react'
import { memo, useEffect, useState } from 'react'
import { Table } from 'start/ui'
import { H5, SizableText, XStack, YStack } from 'tamagui'
import { useCurrentChannelId } from '~/context/CurrentChannelContext'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import { useCurrentServer } from '~/features/server/useCurrentServer'
import { UserListItem } from '~/features/user/ui/UserListItem'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { ListItem } from '~/interface/lists/ListItem'
import { Tabs } from '~/interface/tabs/Tabs'
import { zero } from '~/zero/client'
import { clearClientData } from '~/zero/helpers/clearClientData'

export const DevToolsZeroContent = () => {
  const serverId = useCurrentServerId()
  const channelId = useCurrentChannelId()
  const { channel, server } = useCurrentServer()
  const [selectedTab, setSelectedTab] = useState('status')

  return (
    <YStack data-tauri-drag-region gap="$3">
      <Tabs
        tabs={[
          {
            label: 'Status',
            value: 'status',
          },
          {
            label: 'Actions',
            value: 'actions',
          },
          {
            label: 'Users',
            value: 'users',
          },
        ]}
        initialTab={selectedTab}
        onValueChange={setSelectedTab}
      >
        <Tabs.Content value="status">
          <StatusTab />
        </Tabs.Content>

        <Tabs.Content value="actions">
          <ActionsTab />
        </Tabs.Content>

        <Tabs.Content value="users">
          <UsersTab />
        </Tabs.Content>
      </Tabs>
    </YStack>
  )
}

const StatusTab = memo(() => {
  const [queries, setQueries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const zero = useZero()

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true)
      try {
        const inspector = await zero.inspect()

        if (inspector) {
          const queriesData = await inspector.client.queries()

          // transform query data for table display
          const tableData = queriesData.map((q, index) => {
            const materializationMetric = q.metrics?.['query-materialization-client']
            const totalDuration = Object.values(q.metrics || {}).reduce(
              (sum: number, val: any) => sum + (typeof val === 'number' ? val : 0),
              0
            ) as number

            return {
              id: `query-${index}`,
              table: q.name || q.clientZQL || 'unknown',
              rowCount: q.rowCount || 0,
              status: q.inactivatedAt ? 'inactive' : 'active',
              materializationTime: JSON.stringify(materializationMetric),
              totalTime: `${totalDuration.toFixed(2)}ms`,
              isSlow: totalDuration > 100 ? 'Yes' : 'No',
              lastActive: q.inactivatedAt
                ? new Date(q.inactivatedAt).toLocaleTimeString()
                : 'Active',
            }
          })

          setQueries(tableData)
        }
      } catch (error) {
        console.error('Failed to fetch query metrics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 3000)
    return () => clearInterval(interval)
  }, [zero])

  if (isLoading && queries.length === 0) {
    return (
      <YStack p="$3">
        <SizableText>Loading query metrics...</SizableText>
      </YStack>
    )
  }

  return (
    <YStack flex={1}>
      <YStack>
        {queries.length === 0 ? (
          <SizableText color="$color10">No queries to display</SizableText>
        ) : (
          <Table
            data={queries}
            columns={[
              'table',
              'rowCount',
              'status',
              'isSlow',
              'materializationTime',
              'totalTime',
              'lastActive',
            ]}
            columnWidths={{
              table: 150,
              rowCount: 80,
              status: 80,
              isSlow: 60,
              materializationTime: 120,
              totalTime: 100,
              lastActive: 100,
            }}
            size="small"
            height={600}
            sortable
          />
        )}
      </YStack>
    </YStack>
  )
})

const ActionsTab = memo(() => {
  const serverId = useCurrentServerId()

  const handleRecreatePrivateChatStats = async () => {
    if (!serverId) {
      console.error('no server selected')
      return
    }

    try {
      console.info(`recreating private chat stats for server ${serverId}`)
      await zero.mutate.server.ensureAllPrivateChatStats(serverId).server
      console.info(`completed recreating private chat stats for server ${serverId}`)
    } catch (error) {
      console.error('failed to recreate private chat stats:', error)
    }
  }

  return (
    <XStack flexWrap="wrap" gap="$2">
      <ButtonSimple size="small" onPress={clearClientData} active theme="red">
        Clear local data
      </ButtonSimple>
      <ButtonSimple size="small" onPress={handleRecreatePrivateChatStats} active>
        Re-create private chats
      </ButtonSimple>
    </XStack>
  )
})

const UsersTab = memo(() => {
  const { server, members } = useCurrentServer()
  const [selectedUserId, setSelectedUserId] = useState('')
  const selectedUser = selectedUserId
    ? members?.find((m) => m.id === selectedUserId)
    : null

  if (!members) {
    return <SizableText>No server/members</SizableText>
  }

  return (
    <XStack height={400}>
      <YStack flex={1} borderRightWidth={1} borderColor="$borderColor">
        {members?.map((user) => {
          return (
            <UserListItem
              key={user.id}
              user={user}
              size="small"
              onPress={() => setSelectedUserId(user.id)}
              active={selectedUserId === user.id}
            >
              <ListItem.Text>{user.username || user.name || user.id}</ListItem.Text>
            </UserListItem>
          )
        })}
      </YStack>

      <YStack flex={2} p="$3" gap="$3">
        {selectedUser ? (
          <>
            <>
              <H5>User Details</H5>
              <XStack gap="$2">
                <SizableText>ID:</SizableText>
                <SizableText fontFamily="$mono">{selectedUser.id}</SizableText>
              </XStack>
              <XStack gap="$2">
                <SizableText>Migration Version:</SizableText>
                <SizableText fontFamily="$mono">
                  {selectedUser.migrationVersion || 0}
                </SizableText>
              </XStack>
            </>
          </>
        ) : (
          <H5>Select a user to view details</H5>
        )}
      </YStack>
    </XStack>
  )
})
