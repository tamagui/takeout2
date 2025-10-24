import { dialogConfirm } from '~/interface/dialogs/actions'
import { dialogSignup } from '~/interface/dialogs/isSignedUpEmitter'
import { showToast } from '~/interface/toast/Toast'
import type { PreventableEvent } from '~/interface/types'
import { zero } from '~/zero/client'
import type { ServerWithMembership } from '~/data/types'
import { useCurrentServer } from '../server/useCurrentServer'
import { getUser } from './getUser'

export const useJoinServer = () => {
  const { server } = useCurrentServer()

  return {
    server,
    hasJoined: !!server?.member,
    toggleJoinServer: (e?: PreventableEvent) => {
      if (!server) {
        showToast(`No server`)
        return
      }
      toggleJoinServer(server, e)
    },
  }
}

export const toggleJoinServer = async (
  server: ServerWithMembership,
  e?: PreventableEvent
) => {
  const serverId = server.id
  const hasJoined = !!server.member
  const user = getUser()

  if (!user) {
    dialogSignup()
    return
  }

  if (hasJoined) {
    e?.preventDefault()

    if (
      await dialogConfirm({
        title: `Leave server?`,
        description: `Are you sure you want to leave?`,
      })
    ) {
      zero.mutate.serverMember.delete({
        userId: user.id,
        serverId: serverId,
      })
    }
    // TODO
  } else {
    zero.mutate.serverMember.insert({
      joinedAt: Date.now(),
      userId: user.id,
      serverId: serverId,
      hasClosedWelcome: false,
    })
  }
}
