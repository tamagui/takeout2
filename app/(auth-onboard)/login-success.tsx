import { useEffect } from 'react'
import { YStack } from 'tamagui'
import { setAuthClientToken, useAuth } from '~/features/auth/client/authClient'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'

export function LoginSuccess() {
  const { session, token, user } = useAuth()
  console.info(`LoginSuccess`, { session, token, user })

  useEffect(() => {
    console.info(`LoginSuccess useAsyncEffect`, { session, windowOpener: window.opener })
    if (window.opener && session) {
      if (token) {
        // trying to pass back not working yet
        setAuthClientToken({ session: session.token, token })
      }

      console.info(`LoginSuccess posting message to opener ${window.location.origin}`)
      window.opener.postMessage(
        { type: 'login-success', session: session.token, token },
        window.location.origin
      )

      window.close()
    }
  }, [session, token])

  return (
    <YStack flex={1} items="center" justify="center" width="100%" height="100%" gap="$4">
      <CheckIcon opacity={0.5} />
    </YStack>
  )
}
