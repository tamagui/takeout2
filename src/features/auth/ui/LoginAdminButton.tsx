import { router } from 'one'

import { Button } from '~/interface/buttons/Button'
import { dialogEmit } from '~/interface/dialogs/shared'

export const LoginAdminButton = () => {
  const handleSignInAdmin = () => {
    dialogEmit({ type: 'admin-password' })
    router.replace('/home/feed')
  }
  return (
    <>
      {window.location.search.includes('showAdmin') && (
        <Button
          variant="outlined"
          size="large"
          onPress={handleSignInAdmin}
          w="100%"
          scale="press:0.97 enter:0.95"
          transition="200ms"
          opacity="enter:0"
          data-testid="login-as-admin"
        >
          Continue as admin (dev)
        </Button>
      )}
    </>
  )
}
