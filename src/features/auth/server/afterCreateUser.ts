import { zeroServer } from '~/zero/server'

export async function afterCreateUser(user: { id: string; email: string }) {
  await zeroServer.mutate(async (tx, mutate) => {
    await mutate.userPublic.completeSignup(tx, user.id)
  })
}
