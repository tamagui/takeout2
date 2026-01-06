import { router } from 'one'
import { useCallback, useState } from 'react'
import {
  AnimatePresence,
  isWeb,
  SizableText,
  Spinner,
  useTheme,
  View,
  XStack,
  YStack,
  type ColorTokens,
} from 'tamagui'

import {
  APP_NAME,
  EULA_URL,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from '~/constants/app'
import { signInAsDemo } from '~/features/auth/client/signInAsDemo'
import { onboardingSlides } from '~/features/onboarding'
import { Onboarding } from '~/features/onboarding/Onboarding'
import { useIsDark } from '~/features/theme/useIsDark'
import { isDemoMode } from '~/helpers/isDemoMode'
import { Link } from '~/interface/app/Link'
import { GradientBackground } from '~/interface/backgrounds/GradientBackground'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { dialogEmit } from '~/interface/dialogs/shared'
import { AppleIcon } from '~/interface/icons/AppleIcon'
import { GoogleIcon } from '~/interface/icons/GoogleIcon'
import { TamaguiDotLogo } from '~/interface/icons/logos/TamaguiDotLogo'
import { H2 } from '~/interface/text/Headings'
import { showToast } from '~/interface/toast/helpers'

export const LoginPage = () => {
  const theme = useTheme()
  const isDark = useIsDark()
  const [demoLoading, setDemoLoading] = useState<boolean>(false)
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!isWeb)

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
      <View
        position="absolute"
        justify="center"
        items="center"
        t={0}
        l={0}
        r={0}
        b={0}
        z={999}
        pointerEvents="none"
      >
        <View
          // @ts-ignore
          animation={['medium', { delay: 500 }]}
          scale={1.2}
          y={-80}
          enterStyle={{ scale: 1, y: 0 }}
        >
          <TamaguiDotLogo size={80} color={theme.color.val as ColorTokens} />
        </View>
      </View>
      <View
        // @ts-ignore
        animation={['medium', { delay: 1200 }]}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        flex={1}
        px="$4"
        pb="$4"
        justify="flex-end"
      >
        <H2 text="center" fontFamily="$heading">
          Login to {APP_NAME}
        </H2>
        <YStack gap="$3" mt="$4">
          <Link href="/signup/email" asChild>
            <ButtonSimple
              size="large"
              glass
              glassTint="orange"
              pressStyle={{
                scale: 0.97,
                opacity: 0.9,
              }}
              width="100%"
              animation="200ms"
              enterStyle={{ opacity: 0, scale: 0.95 }}
            >
              Continue with Email
            </ButtonSimple>
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
              animation="200ms"
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

        <YStack items="center" gap="$2" mt="$4">
          <SizableText size="$3" text="center" color="$color">
            {` By continuing, you agree to our\n`}
            <Link href={TERMS_OF_SERVICE_URL}>Terms of Service</Link>,{' '}
            <Link href={PRIVACY_POLICY_URL}>Privacy Policy</Link> and{' '}
            <Link href={EULA_URL}>EULA.</Link>
          </SizableText>
        </YStack>
      </View>

      {/* <AnimatePresence>
        {showOnboarding && !isWeb && (
          <View
            animation="200ms"
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
      </AnimatePresence> */}
    </GradientBackground>
  )
}
