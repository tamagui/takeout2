import { useAuth } from '~/features/auth/client/authClient'
import { Link } from '~/interface/app/Link'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'

export const LoginButton = () => {
  const { state } = useAuth()

  return (
    <Link href={state === 'logged-in' ? '/home' : '/login'}>
      <ButtonSimple>{state === 'logged-in' ? 'Account' : 'Login'}</ButtonSimple>
    </Link>
  )
}
