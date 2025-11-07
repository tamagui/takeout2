import { H1, YStack } from 'tamagui'
import { useAuth } from '~/features/auth/client/authClient'
import { useOnboarding } from '~/features/onboarding/useOnboarding'
import { Link } from '~/features/routing/Link'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'

export default function IndexPage() {
  useOnboarding()

  return (
    <YStack flex={1} items="center" justify="center">
      <H1>Welcome</H1>
      <LoginButton />
    </YStack>
  )
}

const LoginButton = () => {
  const { state } = useAuth()

  return (
    <Link href={state === 'logged-in' ? '/home' : '/login'}>
      <ButtonSimple>{state === 'logged-in' ? 'Account' : 'Login'}</ButtonSimple>
    </Link>
  )
}
