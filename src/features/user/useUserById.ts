import { userById } from '~/data/user/queries'
import { useQuery } from '~/zero/client'

export function useUserById(userId: string | undefined) {
  return useQuery(userById, { userId: userId! }, { enabled: Boolean(userId) })
}
