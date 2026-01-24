import { Link } from '~/interface/app/Link'
import { ButtonAction } from '~/interface/buttons/ButtonAction'
import { EnvelopeSimpleIcon } from '~/interface/icons/phosphor/EnvelopeSimpleIcon'

export const LoginEmailButton = () => {
  return (
    <Link href="/auth/signup/email" asChild>
      <ButtonAction
        size="large"
        variant="floating"
        haptic
        width="100%"
        icon={EnvelopeSimpleIcon}
      >
        Continue with Email
      </ButtonAction>
    </Link>
  )
}
