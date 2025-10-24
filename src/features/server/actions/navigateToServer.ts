import { router } from 'one'
import type { Server } from '~/data/types'

export async function navigateToServer(server: Pick<Server, 'id'>) {
  router.navigate(`/${server.id}`)
}
