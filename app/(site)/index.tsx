import { H1, YStack } from 'tamagui'
import { useAuth } from '~/features/auth/client/authClient'
import { Link } from '~/interface/app/Link'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'

export default function IndexPage() {
  return (
    <YStack items="center" justify="center">
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
