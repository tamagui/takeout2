import { Link } from '~/interface/app/Link'
import { Button } from '~/interface/buttons/Button'
import { EnvelopeSimpleIcon } from '~/interface/icons/phosphor/EnvelopeSimpleIcon'

export const LoginEmailButton = () => {
  return (
    <Link href="/auth/signup/email" asChild>
      <Button
        theme="accent"
        size="large"
        variant="floating"
        haptic
        w="100%"
        icon={EnvelopeSimpleIcon}
        h={48}
      >
        Continue with Email
      </Button>
    </Link>
  )
}
