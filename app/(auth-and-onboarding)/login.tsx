import { router } from 'one'
import { useEffect } from 'react'
import { YStack } from 'tamagui'
import { useAuth } from '~/auth/client/authClient'
import { LoginSignupContents } from '~/auth/ui/LoginSignupContents'

export const LoginPage = () => {
  const { session } = useAuth()

  useEffect(() => {
    if (session) {
      router.push('/')
    }
  }, [session])

  return (
    <>
      <YStack py="$6" flex={1} items="center" justify="center">
        <LoginSignupContents />
      </YStack>
    </>
  )
}
