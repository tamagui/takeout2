import { useMemo } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import { ServerListItem } from '~/features/server/ui/ServerListItem'
import { UserListItem } from '~/features/user/ui/UserListItem'
import { validColor } from '~/interface/colors/validColor'
import { ChannelListItem } from '~/interface/sidebar/ChannelListItem'
import { useQuery } from '~/zero/client'
import { runQuerySandbox } from '../ai/runQuerySandbox'
import { queryMessageItemRelations } from '../message/queryMessageItemRelations'
import { MessageItemMinimal } from '../message/ui/MessageItemMinimal'
import { Code } from './Code'

const DataRenderer = ({ tableName, data }: { tableName: string; data: any }) => {
  const serverId = useCurrentServerId()

  const content = (() => {
    switch (tableName) {
      case 'message':
        return <MessageItemMinimal message={data} />

      case 'channel':
        return <ChannelListItem channel={data} serverId={serverId || ''} />

      case 'userPublic':
        return <UserListItem user={data} />

      case 'server':
        return <ServerListItem server={data} />

      case 'role':
        return (
          <XStack items="center" gap="$2" p="$2">
            <YStack
              width={16}
              height={16}
              rounded="$2"
              bg={validColor(data.color || '$color5')}
            />
            <Text fontWeight="500">{data.name}</Text>
          </XStack>
        )

      default:
        // Fallback for unknown types
        return (
          <YStack p="$2">
            <Text fontSize="$2" color="$color11" fontFamily="$mono">
              {tableName}: {data.name || data.title || data.id}
            </Text>
          </YStack>
        )
    }
  })()

  return <YStack minH={50}>{content}</YStack>
}

export const MarkdownSandboxQuery = ({ transformCode, ...props }: any) => {
  const queryString = props.children as string
  const tableMatch = queryString.match(/zero\.query\.(\w+)/)
  const tableName = tableMatch?.[1]
  const serverId = useCurrentServerId()

  const result = useMemo(() => {
    const sandboxResult = runQuerySandbox(queryString)

    if (sandboxResult.success && tableName === 'message') {
      sandboxResult.query = queryMessageItemRelations(sandboxResult.query, serverId)
    }

    return sandboxResult
  }, [queryString, tableName, serverId])

  // Use the query if successful
  const [queryResult] = useQuery(
    result.success && result.query ? result.query : (null as any)
  )

  return (
    <YStack
      bg="$background"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
      className="styled-block"
      maxW="100%"
    >
      <XStack p="$2" bg="$color2" borderBottomWidth={1} borderBottomColor="$borderColor">
        <Code lang="tsx">{queryString}</Code>
      </XStack>

      <YStack>
        {result.success ? (
          queryResult ? (
            tableName ? (
              Array.isArray(queryResult) ? (
                <YStack>
                  {([].concat(queryResult as any) as any[]).map((item, index: number) => (
                    <DataRenderer
                      key={item.id || index}
                      tableName={tableName}
                      data={item}
                    />
                  ))}
                </YStack>
              ) : (
                <DataRenderer tableName={tableName} data={queryResult} />
              )
            ) : (
              <pre
                style={{
                  margin: 0,
                  padding: '8px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '300px',
                }}
              >
                <code>{JSON.stringify(queryResult, null, 2)}</code>
              </pre>
            )
          ) : (
            <YStack p="$3" items="center">
              <Text color="$color10">Loading...</Text>
            </YStack>
          )
        ) : (
          <YStack p="$3">
            <Text color="red" fontSize="$2">
              Error: {result.error}
            </Text>
          </YStack>
        )}
      </YStack>

      {!!transformCode && (
        <>
          <YStack p="$2" bg="$color2" borderTopWidth={1} borderTopColor="$borderColor">
            <Text fontSize="$2" color="$color11" mb="$1">
              Transform:
            </Text>
            <Code lang="tsx">{transformCode}</Code>
          </YStack>
        </>
      )}
    </YStack>
  )
}
