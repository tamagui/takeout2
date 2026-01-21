import { router } from 'one'
import { useState } from 'react'
import { Circle, SizableText, Spinner, XStack, YStack } from 'tamagui'

import {
  APP_NAME,
  EULA_URL,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from '~/constants/app'
import { signInAsDemo } from '~/features/auth/client/signInAsDemo'
import { isDemoMode } from '~/helpers/isDemoMode'
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
  const [demoLoading, setDemoLoading] = useState<boolean>(false)

  const handleSignInAdmin = () => {
    dialogEmit({ type: 'admin-password' })
    router.replace('/home/feed')
  }

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    showToast(`${provider} login coming soon!`, { type: 'info' })
  }

  return (
    <XStack flex={1} flexBasis="auto" position="relative">
      <YStack flex={1} justify="center" items="center">
        <Circle
          size={80}
          my="$4"
          transition="medium"
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
          p="$10"
          $maxSM={{ p: '$6' }}
        >
          <H2 text="center">Login to {APP_NAME}</H2>

          <YStack
            key="welcome-content"
            gap="$4"
            items="center"
            width="100%"
            transition="medium"
            enterStyle={{ opacity: 0, y: 10 }}
            exitStyle={{ opacity: 0, y: -10 }}
            position="relative"
            overflow="hidden"
          >
            <YStack width="100%" gap="$4">
              <Link
                href="/auth/signup/email"
                $platform-web={{
                  display: 'contents',
                }}
              >
                <ButtonAction
                  theme="accent"
                  size="large"
                  pressStyle={{
                    scale: 0.97,
                    opacity: 0.9,
                  }}
                  transition="200ms"
                  enterStyle={{ opacity: 0, scale: 0.95 }}
                >
                  Continue with Email
                </ButtonAction>
              </Link>

              {window.location.search.includes('showAdmin') && (
                <ButtonSimple
                  variant="outlined"
                  size="large"
                  onPress={handleSignInAdmin}
                  width="100%"
                  data-testid="login-as-admin"
                  pressStyle={{
                    scale: 0.97,
                  }}
                  transition="200ms"
                  enterStyle={{ opacity: 0, scale: 0.95 }}
                >
                  Continue as admin (dev)
                </ButtonSimple>
              )}

              {/* DEMO mode - enabled in dev or when VITE_DEMO_MODE=1 */}
              {isDemoMode && (
                <ButtonSimple
                  variant="outlined"
                  size="large"
                  onPress={async () => {
                    setDemoLoading(true)
                    const { error } = await signInAsDemo()
                    setDemoLoading(false)
                    if (error) {
                      showToast('Demo login failed', { type: 'error' })
                    }
                    // AppLayout handles redirect when auth state changes
                  }}
                  disabled={demoLoading}
                  width="100%"
                  data-testid="login-as-demo"
                  pressStyle={{
                    scale: 0.97,
                  }}
                  transition="200ms"
                  enterStyle={{ opacity: 0, scale: 0.95 }}
                >
                  {demoLoading ? <Spinner size="small" /> : 'Login as Demo User'}
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
                transition="200ms"
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
                transition="200ms"
                enterStyle={{ opacity: 0, scale: 0.95 }}
                icon={<AppleIcon size={20} />}
              />
            </XStack>
          </YStack>
          <YStack items="center" gap="$2" mt="$4">
            <SizableText size="$3" text="center" color="$color10">
              {` By continuing, you agree to our\n`}
              <Link href={TERMS_OF_SERVICE_URL}>Terms of Service</Link>,{' '}
              <Link href={PRIVACY_POLICY_URL}>Privacy Policy</Link> and{' '}
              <Link href={EULA_URL}>EULA.</Link>
            </SizableText>
          </YStack>
        </YStack>
      </YStack>
    </XStack>
  )
}
