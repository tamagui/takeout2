import { SizableText, YStack } from 'tamagui'

import { EULA_URL, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '~/constants/app'
import { Link } from '~/interface/app/Link'

export const LoginLegalText = () => {
  return (
    <YStack items="center" gap="$2">
      <SizableText size="$2" text="center" color="$color10" px="$2" lineHeight="$3">
        By continuing, you agree to our <Link href={TERMS_OF_SERVICE_URL}>Terms</Link>,{' '}
        <Link href={PRIVACY_POLICY_URL}>Privacy</Link> & <Link href={EULA_URL}>EULA</Link>
      </SizableText>
    </YStack>
  )
}
