import { authClient, setAuthClientToken } from '~/auth/client/authClient'

export async function impersonate(id: string) {
  const out = await authClient.admin.impersonateUser({
    userId: id,
  })
  console.warn(`now`, out.data)
  setAuthClientToken({
    session: out.data?.session.token || '',
    token: '',
  })
}
