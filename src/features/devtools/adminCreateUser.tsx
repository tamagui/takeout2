import { authClient } from '../../auth/client/authClient'
import type { CreateUserParams } from './CreateUserParams'
import { setDevGlobal } from './devGlobal'

export const adminCreateUser = async (params: CreateUserParams) => {
  const userResult = await authClient.admin.createUser(params)

  const userId = userResult?.data?.user?.id
  if (!userId || !userResult.data?.user) {
    throw new Error('Failed to create user')
  }

  return userResult.data.user
}

setDevGlobal(adminCreateUser, 'createUser')
