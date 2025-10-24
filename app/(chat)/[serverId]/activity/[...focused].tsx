import { useChannelParams } from '~/features/apps/useChannelParams'
import { ChannelMain } from '~/features/channel/ui/ChannelMain'

export default function ActivityFocusedPage() {
  const { channelId, message, serverId } = useChannelParams()

  return (
    <ChannelMain
      key={channelId}
      message={message || ''}
      channelId={channelId || ''}
      serverId={serverId || ''}
    />
  )
}
