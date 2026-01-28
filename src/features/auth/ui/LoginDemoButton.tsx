import { useState } from 'react'
import { Spinner } from 'tamagui'

import { signInAsDemo } from '~/features/auth/client/signInAsDemo'
import { isDemoMode } from '~/helpers/isDemoMode'
import { Button } from '~/interface/buttons/Button'
import { showToast } from '~/interface/toast/helpers'

export const LoginDemoButton = () => {
  const [loading, setLoading] = useState(false)

  if (!isDemoMode) return null

  const handleLoginAsDemo = async () => {
    setLoading(true)
    const { error } = await signInAsDemo()
    setLoading(false)
    if (error) {
      showToast('Demo login failed', { type: 'error' })
    }
  }

  return (
    <Button
      size="large"
      haptic
      onPress={handleLoginAsDemo}
      disabled={loading}
      width="100%"
      data-testid="login-as-demo"
      pressStyle={{ scale: 0.97 }}
      transition="200ms"
      enterStyle={{ opacity: 0, scale: 0.95 }}
    >
      {loading ? <Spinner size="small" /> : 'Login as Demo User'}
    </Button>
  )
}
