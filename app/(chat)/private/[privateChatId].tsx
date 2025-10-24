import { useParams } from 'one'
import { ChannelMain } from '~/features/channel/ui/ChannelMain'

export const PrivateChatPage = () => {
  const params = useParams<{
    privateChatId: string
    channelId: string
    serverId: string
  }>()

  return (
    <ChannelMain
      serverId={params.privateChatId || ''}
      channelId={params.privateChatId || ''}
      message=""
    />
  )
}
