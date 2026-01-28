import { useAuth } from '~/features/auth/client/authClient'
import { Link } from '~/interface/app/Link'
import { Button } from '~/interface/buttons/Button'

export const LoginButton = () => {
  const { loginText, loginLink } = useAuth()

  return (
    <Link href={loginLink}>
      <Button>{loginText}</Button>
    </Link>
  )
}
