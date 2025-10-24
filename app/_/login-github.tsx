import { useParams } from 'one'
import { useState } from 'react'
import { Paragraph, Spinner, Text, YStack } from 'tamagui'
import { authClient, useAuth } from '~/auth/client/authClient'
import { FinishTauriAppLoginButton } from '~/auth/ui/FinishTauriAppLoginButton'
import { useAsyncEffect } from '@vxrn/helpers'
import { dialogSignup } from '~/interface/dialogs/isSignedUpEmitter'
import {
  setShouldRedirectBackToTauri,
  useTauriAuthDeepLink,
} from '~/tauri/authFlowHelpers'

let hasCalled = false

export function LoginGithub() {
  const search = useParams()
  const { token } = useAuth()
  const fromTauri = 'from-tauri' in search
  const link = useTauriAuthDeepLink()
  const [error, setError] = useState<unknown | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useAsyncEffect(async () => {
    // Should retry if error is cleared by user, so do not do anything if error is not null
    if (error) return
    if (hasCalled) return

    if (fromTauri) {
      if (token) {
        // we have jwt to pass already
        return
      }
      setShouldRedirectBackToTauri(fromTauri)
      dialogSignup()
      // return
    }

    try {
      hasCalled = true
      setIsLoading(true)
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/_/login-success',
      })
    } catch (err) {
      console.error(`Error`, err)
      setError(`${err}`)
    }
  }, [error, token])

  if (error) {
    return (
      <YStack items="center" justify="center" flex={1} width="100%" height="100%">
        <Text>Unexpected error occurred, please retry.</Text>
      </YStack>
    )
  }

  if (fromTauri) {
    return (
      <YStack items="center" justify="center" flex={1} width="100%" height="100%">
        {link ? (
          <FinishTauriAppLoginButton />
        ) : (
          <YStack gap="$2">
            <Paragraph height="100%">Loading user...</Paragraph>
            <Spinner />
          </YStack>
        )}
      </YStack>
    )
  }

  return (
    <YStack items="center" justify="center" flex={1} width="100%" height="100%">
      <Spinner />
    </YStack>
  )
}
