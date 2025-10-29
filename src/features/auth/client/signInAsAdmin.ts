import { authClient } from '~/features/auth/client/authClient'
import { ADMIN_EMAIL } from '~/constants/app'

export const signInAsAdmin = async () => {
  const { error } = await authClient.signUp.email({
    name: `Admin`,
    email: ADMIN_EMAIL,
    password: `password123`,
  })

  // if already exists (422) just login
  if (error && error.status !== 422) {
    return { error }
  }

  const loginRes = await authClient.signIn.email({
    email: ADMIN_EMAIL,
    password: `password123`,
  })

  if (loginRes.error) {
    return { error: loginRes.error }
  }

  return { success: true }
}
