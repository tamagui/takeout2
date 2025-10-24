import { router } from 'one'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import { useCurrentThreadId } from '~/context/CurrentThreadContext'
import { getMessageLink } from '~/features/message/getMessageLink'
import { zero } from '~/zero/client'
import type { Thread } from '~/data/types'
import { ListItem } from '../lists/ListItem'
import { useMemoStable } from '@vxrn/hooks'
import { dialogConfirm } from '../dialogs/actions'

export const ThreadListItem = ({
  thread,
  isHud,
  showMenu,
}: {
  thread: Thread
  isHud?: boolean
  showMenu?: boolean
}) => {
  // TODO context helper should be based on emitters likely
  // so we can useEmitterSelectors([thread, server]) to avoid re-renders
  const threadId = useCurrentThreadId()
  const serverId = useCurrentServerId()
  const isActive = threadId === thread.id

  const contextMenuItems = useMemoStable(
    (): { text: string; action?: Function; icon?: React.ReactNode }[] | undefined => {
      if (!showMenu) return
      return [
        {
          text: 'Delete',
          async action() {
            if (await dialogConfirm({ title: `Delete conversation?` })) {
              await zero.mutate.thread.delete({
                id: thread.id,
              })

              // navigate to server channel
              router.navigate(`/${serverId}`)
            }
          },
        },
      ]
    },
    [showMenu],
    {
      name: 'thread-contextMenu',
    }
  )

  return (
    <ListItem
      variant="sidebar"
      size="small"
      active={isActive}
      contextMenu={contextMenuItems}
      onPress={() => {
        if (isActive) {
          router.setParams({ thread: '' })
        } else {
          if (isHud) {
            router.setParams({ hudThread: thread.id })
          } else {
            router.navigate(
              getMessageLink({
                channelId: thread.channelId,
                serverId,
                threadId: thread.id,
                // TODO?
                id: '',
              })
            )
          }
        }
      }}
      key={thread.id}
    >
      <ListItem.Text ellipse>{thread.title || '...'}</ListItem.Text>
    </ListItem>
  )
}
