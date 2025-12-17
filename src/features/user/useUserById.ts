import { userById } from '~/data/queries/user'
import { useQuery } from '~/zero/client'

export function useUserById(userId: string | undefined) {
  return useQuery(userById, { userId: userId! }, { enabled: Boolean(userId) })
}
