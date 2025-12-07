import { ADMIN_EMAIL } from '~/constants/app'
import { authClient } from '~/features/auth/client/authClient'

export const signInAsAdmin = async (password: string) => {
  const { error } = await authClient.signUp.email({
    name: `Admin`,
    email: ADMIN_EMAIL,
    password,
  })

  // if already exists (422) just login
  if (error && error.status !== 422) {
    return { error }
  }

  const loginRes = await authClient.signIn.email({
    email: ADMIN_EMAIL,
    password,
  })

  if (loginRes.error) {
    return { error: loginRes.error }
  }

  return { success: true }
}
