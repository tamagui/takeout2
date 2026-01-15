import { useAuth } from '~/features/auth/client/authClient'
import { Link } from '~/interface/app/Link'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'

export const LoginButton = ({ listItem }: { listItem?: boolean }) => {
  const { loginText, loginLink } = useAuth()

  return (
    <Link href={loginLink}>
      <ButtonSimple>{loginText}</ButtonSimple>
    </Link>
  )
}
