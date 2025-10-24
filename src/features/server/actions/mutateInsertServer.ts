import { updateUserState } from '~/features/user/userState'
import { randomId } from '@vxrn/helpers'
import { ensureSignedUp } from '~/interface/dialogs/isSignedUpEmitter'
import { showToast } from '~/interface/toast/Toast'
import type { Server } from '~/data/types'
import { zero } from '~/zero/client'

// TODO can we completely move to custom mutator?

export const mutateInsertServer = async (serverPartial: Partial<Server>) => {
  const currentUser = await ensureSignedUp()

  if (!/[a-z][a-z0-9-]+/.test(serverPartial.id || '')) {
    showToast(`Invalid domain!`)
    return
  }

  const serverId = serverPartial.id || randomId()

  const server = {
    id: serverId,
    description: '',
    icon: Math.random() > 0.5 ? 'red' : 'pink',
    name: 'Lorem',
    creatorId: currentUser.id,
    state: {},
    channelSort: [],
    createdAt: Date.now(),
    isPrivateChat: false,
    ...serverPartial,
  } satisfies Server

  showToast(`Creating ${server.name}...`)

  await zero.mutate.server.insert(server).server

  updateUserState({
    activeServer: serverId,
  })

  return server
}
