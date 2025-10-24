import { useParams } from 'one'
import { ProvideCurrentServerId } from '~/context/CurrentServerContext'
import { ProvideCurrentThreadId } from '~/context/CurrentThreadContext'
import { MessagesLoading } from '~/features/message/ui/MessagesLoading.native'
import { MainOpenThread } from '~/features/thread/ui/MainOpenThread.native'
import { useQuery, zero } from '~/zero/client'

export default function ThreadPage() {
  const params = useParams()
  const { serverId, channelId, messageId } = params as {
    serverId: string
    channelId: string
    messageId: string
  }

  // first get the threadId from the messageId
  const [threads] = useQuery(zero.query.thread.where('messageId', messageId), {
    enabled: Boolean(messageId),
  })

  const threadId = threads?.[0]?.id

  if (!threadId) {
    return <MessagesLoading />
  }

  // provide the thread context and server context
  return (
    <ProvideCurrentThreadId value={threadId}>
      <ProvideCurrentServerId value={serverId}>
        <MainOpenThread
          threadId={threadId}
          serverId={serverId}
          channelId={channelId}
          messageId={messageId}
        />
      </ProvideCurrentServerId>
    </ProvideCurrentThreadId>
  )
}
