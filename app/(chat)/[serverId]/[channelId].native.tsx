import { YStack } from 'tamagui'
import { ChannelMain } from '~/features/channel/ui/ChannelMain'
import { UserPresenceMutator } from '~/features/presence/UserPresenceMutator'
import { useServerParams } from '~/features/server/useServerParams'

export default function ChannelPage() {
  const params = useServerParams()
  const { channelId, serverId, message, userServerId } = params

  return (
    <YStack data-testid="channel-main" flex={1}>
      <ChannelMain
        key={channelId}
        message={message || ''}
        channelId={userServerId || channelId || ''}
        serverId={userServerId || serverId || ''}
      />
    </YStack>
  )
}
