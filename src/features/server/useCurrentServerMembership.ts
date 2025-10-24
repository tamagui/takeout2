import { useQuery, zero } from '~/zero/client'
import { useUserState } from '../user/userState'
import { useUser } from '../user/useUser'

export const useCurrentServerMembership = () => {
  const activeServer = useUserState('activeServer')
  const { user } = useUser()
  return useQuery(
    zero.query.serverMember
      .where('userId', activeServer || '')
      .where('serverId', user?.id || '')
  )[0][0]
}
