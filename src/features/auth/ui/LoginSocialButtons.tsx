import { Separator, SizableText, XStack } from 'tamagui'

import { Button } from '~/interface/buttons/Button'
import { AppleIcon } from '~/interface/icons/AppleIcon'
import { GoogleIcon } from '~/interface/icons/GoogleIcon'
import { showToast } from '~/interface/toast/helpers'

const handleSocialLogin = async (provider: 'google' | 'apple') => {
  showToast(`${provider} login coming soon!`, { type: 'info' })
}

export const LoginSocialButtons = () => {
  return (
    <>
      <XStack items="center" gap="$4">
        <Separator />
        <SizableText size="$2" color="$color9">
          or continue with
        </SizableText>
        <Separator />
      </XStack>

      <XStack gap="$3">
        <Button
          flex={1}
          size="large"
          haptic
          onPress={() => handleSocialLogin('google')}
          pressStyle={{ scale: 0.98, bg: '$color3' }}
          icon={<GoogleIcon size={20} />}
        >
          Google
        </Button>
        <Button
          flex={1}
          size="large"
          haptic
          onPress={() => handleSocialLogin('apple')}
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          icon={<AppleIcon size={22} />}
        >
          <SizableText fontWeight="600">Apple</SizableText>
        </Button>
      </XStack>
    </>
  )
}
