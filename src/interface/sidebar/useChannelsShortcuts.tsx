import { router } from 'one'
import { useEvent } from 'tamagui'
import { useGetCurrentChannelId } from '~/context/CurrentChannelContext'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import { getChannelLink } from '~/features/channel/getChannelLink'
import { getHudOpen } from '~/features/hud/useUserHud'
import { useShortcutIf } from '~/features/shortcuts/shortcuts'

type MinimalChannelForLinking = { id: string; serverId: string }

export const useChannelsShortcuts = (
  channelsIn?: readonly MinimalChannelForLinking[] | null
) => {
  const getChannelId = useGetCurrentChannelId()
  const serverId = useCurrentServerId()

  const getChannels = useEvent((): readonly MinimalChannelForLinking[] => {
    const serverChannel: MinimalChannelForLinking = { id: serverId, serverId }
    if (!channelsIn) {
      return [serverChannel]
    }
    return [serverChannel, ...channelsIn]
  })

  const navigateToIndex = useEvent((index: number) => {
    const channels = getChannels()
    const next = channels[index]
    if (next) {
      router.navigate(getChannelLink(next))
    }
  })

  const moveIndex = useEvent((by: number) => {
    const channels = getChannels()
    if (channels.length <= 1) return
    const index = channels.findIndex((x) => x.id === getChannelId())
    let newIndex = index + by
    if (newIndex < 0) {
      newIndex = channels.length - 1
    } else if (newIndex >= channels.length) {
      newIndex = 0
    }
    navigateToIndex(newIndex)
  })

  const isNotInHud = () => !getHudOpen()

  useShortcutIf(isNotInHud, 'Meta+[', () => moveIndex(-1))
  useShortcutIf(isNotInHud, 'Meta+]', () => moveIndex(1))
}
