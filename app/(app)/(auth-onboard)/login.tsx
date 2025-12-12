import { LinearGradient } from '@tamagui/linear-gradient'
import { router } from 'one'
import { Circle, isWeb, SizableText, XStack, YStack } from 'tamagui'

import {
  APP_NAME,
  EULA_URL,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from '~/constants/app'
import { Link } from '~/interface/app/Link'
import { LogoIcon } from '~/interface/app/LogoIcon'
import { ButtonAction } from '~/interface/buttons/ButtonAction'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { dialogEmit } from '~/interface/dialogs/shared'
import { AppleIcon } from '~/interface/icons/AppleIcon'
import { GoogleIcon } from '~/interface/icons/GoogleIcon'
import { H2 } from '~/interface/text/Headings'
import { showToast } from '~/interface/toast/helpers'

export const LoginPage = () => {
  const handleSignInAdmin = () => {
    dialogEmit({ type: 'admin-password' })
    router.replace('/home')
  }

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    showToast(`${provider} login coming soon!`, { type: 'info' })
  }

  return (
    <XStack flex={1} position="relative">
      {!isWeb && (
        <LinearGradient
          colors={['#313131', 'transparent']}
          position="absolute"
          t={0}
          l={0}
          r={0}
          b={0}
          height={200}
        />
      )}

      <YStack flex={1} justify="center" items="center">
        <Circle
          size={80}
          my="$4"
          animation="medium"
          enterStyle={{ scale: 0.95, opacity: 0 }}
        >
          <LogoIcon size={42} />
        </Circle>

        <YStack
          gap="$6"
          width="100%"
          items="center"
          bg="$background"
          rounded="$8"
          p={isWeb ? '$6' : '$4'}
          maxW={isWeb ? 400 : '90%'}
        >
          <H2 text="center">Login to {APP_NAME}</H2>

          <YStack
            key="welcome-content"
            gap="$4"
            items="center"
            width="100%"
            animation="medium"
            enterStyle={{ opacity: 0, y: 10 }}
            exitStyle={{ opacity: 0, y: -10 }}
            position="relative"
            overflow="hidden"
          >
            <YStack width="100%" gap="$3">
              <Link href="/signup/email" asChild>
                <ButtonAction
                  glass
                  size="large"
                  pressStyle={{
                    scale: 0.97,
                    opacity: 0.9,
                  }}
                  animation="200ms"
                  enterStyle={{ opacity: 0, scale: 0.95 }}
                >
                  Continue with Email
                </ButtonAction>
              </Link>

              {isWeb && window.location.search.includes('showAdmin') && (
                <ButtonSimple
                  variant="outlined"
                  size="large"
                  onPress={handleSignInAdmin}
                  width="100%"
                  data-testid="login-as-admin"
                  pressStyle={{
                    scale: 0.97,
                  }}
                  animation="200ms"
                  enterStyle={{ opacity: 0, scale: 0.95 }}
                >
                  Continue as admin (dev)
                </ButtonSimple>
              )}
            </YStack>

            <XStack width="100%" gap="$3" justify="center" overflow="visible">
              <ButtonSimple
                glass
                size="large"
                onPress={() => handleSocialLogin('google')}
                pressStyle={{
                  scale: 0.97,
                  bg: '$color2',
                }}
                hoverStyle={{
                  bg: '$color2',
                }}
                animation="200ms"
                enterStyle={{ opacity: 0, scale: 0.95 }}
                icon={<GoogleIcon size={18} />}
              />

              <ButtonSimple
                glass
                size="large"
                onPress={() => handleSocialLogin('apple')}
                pressStyle={{
                  scale: 0.97,
                  bg: '$color2',
                }}
                hoverStyle={{
                  bg: '$color2',
                }}
                animation="200ms"
                enterStyle={{ opacity: 0, scale: 0.95 }}
                icon={<AppleIcon size={20} />}
              />
            </XStack>
          </YStack>
          <YStack
            animation="200ms"
            enterStyle={{ opacity: 0 }}
            items="center"
            gap="$2"
            mt="$4"
          >
            <YStack gap="$1">
              <SizableText text="center" color="$color11">
                By continuing, you agree to our
              </SizableText>
              <XStack justify="center" gap="$1">
                <Link href={TERMS_OF_SERVICE_URL}>Terms of Service</Link>
                <SizableText color="$color11">,</SizableText>
                <Link href={PRIVACY_POLICY_URL}>Privacy Policy</Link>
                <SizableText color="$color11">and</SizableText>
                <Link href={EULA_URL}>EULA.</Link>
              </XStack>
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </XStack>
  )
}
