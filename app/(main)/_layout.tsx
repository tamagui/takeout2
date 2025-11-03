import { Redirect, Slot } from 'one'
import { useAuth } from '~/features/auth/client/authClient'
import { Dialogs } from '~/interface/dialogs/Dialogs'

export default function AppLayout() {
  const { state } = useAuth()

  // redirect to login when logged out
  if (state === 'logged-out') {
    return <Redirect href="/login" />
  }

  if (state === 'loading') {
    return null
  }

  return (
    <>
      <Dialogs />
      <Slot />
    </>
  )
}
