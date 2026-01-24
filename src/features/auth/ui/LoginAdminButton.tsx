import { router } from 'one'

import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { dialogEmit } from '~/interface/dialogs/shared'

export const LoginAdminButton = () => {
  const handleSignInAdmin = () => {
    dialogEmit({ type: 'admin-password' })
    router.replace('/home/feed')
  }
  return (
    <>
      {window.location.search.includes('showAdmin') && (
        <ButtonSimple
          variant="outlined"
          size="large"
          onPress={handleSignInAdmin}
          width="100%"
          data-testid="login-as-admin"
          pressStyle={{
            scale: 0.97,
          }}
          transition="200ms"
          enterStyle={{ opacity: 0, scale: 0.95 }}
        >
          Continue as admin (dev)
        </ButtonSimple>
      )}
    </>
  )
}
