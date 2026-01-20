import { router } from 'one'
import { useCallback, useState } from 'react'
import { AnimatePresence, SizableText, Spinner, View, XStack, YStack } from 'tamagui'

import {
  APP_NAME,
  EULA_URL,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from '~/constants/app'
import { signInAsDemo } from '~/features/auth/client/signInAsDemo'
import { Onboarding, onboardingSlides } from '~/features/onboarding'
import { isDemoMode } from '~/helpers/isDemoMode'
import { Link } from '~/interface/app/Link'
import { GradientBackground } from '~/interface/backgrounds/GradientBackground'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { dialogEmit } from '~/interface/dialogs/shared'
import { AppleIcon } from '~/interface/icons/AppleIcon'
import { GoogleIcon } from '~/interface/icons/GoogleIcon'
import { Image } from '~/interface/image/Image'
import { H2 } from '~/interface/text/Headings'
import { showToast } from '~/interface/toast/helpers'

export const LoginPage = () => {
  const [demoLoading, setDemoLoading] = useState<boolean>(false)
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true)

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false)
  }, [])

  const handleSignInAdmin = () => {
    dialogEmit({ type: 'admin-password' })
    router.replace('/home')
  }

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    showToast(`${provider} login coming soon!`, { type: 'info' })
  }

  return (
    <GradientBackground useImage>
      <View flex={1} px="$4" pb="$4" justify="flex-end" gap="$4">
        <View items="center">
          <Image src={require('../../../assets/logo.png')} width={80} height={80} />
        </View>
        <H2 text="center" fontFamily="$heading">
          Login to {APP_NAME}
        </H2>
        <YStack gap="$3" mt="$4">
          <Link href="/auth/signup/email" asChild>
            <ButtonSimple
              size="large"
              glass
              glassTint="orange"
              pressStyle={{
                scale: 0.97,
                opacity: 0.9,
              }}
              width="100%"
              transition="200ms"
              enterStyle={{ opacity: 0, scale: 0.95 }}
            >
              Continue with Email
            </ButtonSimple>
          </Link>

          {/* DEMO mode - enabled in dev or when VITE_DEMO_MODE=1 */}
          {isDemoMode && (
            <ButtonSimple
              size="large"
              glass
              glassTint="mediumpurple"
              onPress={async () => {
                setDemoLoading(true)
                const { error } = await signInAsDemo()
                setDemoLoading(false)
                if (error) {
                  showToast('Demo login failed', { type: 'error' })
                  return
                }
                router.replace('/home')
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
          <XStack width="100%" gap="$3" justify="center">
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
          <SizableText size="$3" text="center" color="$color">
            {` By continuing, you agree to our\n`}
            <Link href={TERMS_OF_SERVICE_URL}>Terms of Service</Link>,{' '}
            <Link href={PRIVACY_POLICY_URL}>Privacy Policy</Link> and{' '}
            <Link href={EULA_URL}>EULA.</Link>
          </SizableText>
        </YStack>
      </View>

      <AnimatePresence>
        {showOnboarding && (
          <View
            transition="200ms"
            position="absolute"
            t={0}
            l={0}
            r={0}
            b={0}
            z={1000}
            enterStyle={{ scale: 0.95 }}
            exitStyle={{ scale: 0 }}
          >
            <Onboarding slides={onboardingSlides} onComplete={handleOnboardingComplete} />
          </View>
        )}
      </AnimatePresence>
    </GradientBackground>
  )
}
