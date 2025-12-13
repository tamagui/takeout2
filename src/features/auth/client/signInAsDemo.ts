import { DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD } from '~/constants/app'
import { authClient } from '~/features/auth/client/authClient'

export const signInAsDemo = async () => {
  // auto-create demo user if it doesn't exist (422 = already exists, which is fine)
  const { error: signupError } = await authClient.signUp.email({
    name: DEMO_NAME,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })

  if (signupError && signupError.status !== 422) {
    return { error: signupError }
  }

  const { error } = await authClient.signIn.email({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })

  if (error) {
    return { error }
  }

  return { success: true }
}
