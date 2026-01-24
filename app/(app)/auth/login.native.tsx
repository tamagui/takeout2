import { useCallback, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatePresence, SizableText, Spinner, View, XStack, YStack } from 'tamagui'

import {
  APP_NAME,
  EULA_URL,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from '~/constants/app'
import { signInAsDemo } from '~/features/auth/client/signInAsDemo'
import { Onboarding, onboardingSlides, onboardingStorage } from '~/features/onboarding'
import { isDemoMode } from '~/helpers/isDemoMode'
import { Link } from '~/interface/app/Link'
import { GradientBackground } from '~/interface/backgrounds/GradientBackground'
import { ButtonAction } from '~/interface/buttons/ButtonAction'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { GlassView } from '~/interface/effects/GlassView'
import { AppleIcon } from '~/interface/icons/AppleIcon'
import { GoogleIcon } from '~/interface/icons/GoogleIcon'
import { EnvelopeSimpleIcon } from '~/interface/icons/phosphor/EnvelopeSimpleIcon'
import { Image } from '~/interface/image/Image'
import { showToast } from '~/interface/toast/helpers'

export const LoginPage = () => {
  const insets = useSafeAreaInsets()
  const [demoLoading, setDemoLoading] = useState<boolean>(false)
  const [showOnboarding, setShowOnboarding] = useState(() => !onboardingStorage.get())

  const handleOnboardingComplete = useCallback(() => {
    onboardingStorage.set(true)
    setShowOnboarding(false)
  }, [])

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    showToast(`${provider} login coming soon!`, { type: 'info' })
  }

  return (
    <GradientBackground useImage useInsets={false}>
      <View flex={1}>
        <View flex={1} items="center" justify="center" pt={insets.top} px="$6">
          <View
            mb="$5"
            transition="300ms"
            enterStyle={{ opacity: 0, scale: 0.9, y: -20 }}
          >
            <Image src={require('../../../assets/logo.png')} width={60} height={60} />
          </View>

          <YStack
            items="center"
            gap="$2"
            transition="300ms"
            enterStyle={{ opacity: 0, y: 10 }}
          >
            <SizableText
              size="$9"
              fontWeight="800"
              fontFamily="$heading"
              text="center"
              color="$color12"
            >
              {APP_NAME}
            </SizableText>
            <SizableText size="$4" color="$color10" text="center" maxW={280}>
              Sign in to continue to your account
            </SizableText>
          </YStack>
        </View>

        <View transition="300ms" enterStyle={{ opacity: 0, y: 30 }}>
          <GlassView
            borderRadius={32}
            intensity={60}
            containerStyle={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              paddingBottom: insets.bottom + 16,
            }}
          >
            <YStack px="$5" pt="$6" gap="$4">
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

              {isDemoMode && (
                <ButtonSimple
                  size="large"
                  haptic
                  onPress={async () => {
                    setDemoLoading(true)
                    const { error } = await signInAsDemo()
                    setDemoLoading(false)
                    if (error) {
                      showToast('Demo login failed', { type: 'error' })
                    }
                  }}
                  disabled={demoLoading}
                  width="100%"
                  data-testid="login-as-demo"
                  pressStyle={{ scale: 0.98 }}
                >
                  {demoLoading ? <Spinner size="small" /> : 'Login as Demo User'}
                </ButtonSimple>
              )}

              <XStack items="center" gap="$4">
                <View flex={1} height={1} bg="$color6" />
                <SizableText size="$2" color="$color9">
                  or continue with
                </SizableText>
                <View flex={1} height={1} bg="$color6" />
              </XStack>

              <XStack gap="$3">
                <ButtonSimple
                  flex={1}
                  size="large"
                  haptic
                  onPress={() => handleSocialLogin('google')}
                  pressStyle={{ scale: 0.98, bg: '$color3' }}
                  icon={<GoogleIcon size={20} />}
                >
                  Google
                </ButtonSimple>

                <ButtonSimple
                  flex={1}
                  size="large"
                  haptic
                  onPress={() => handleSocialLogin('apple')}
                  pressStyle={{ scale: 0.98, opacity: 0.9 }}
                  icon={<AppleIcon size={22} />}
                >
                  <SizableText fontWeight="600">Apple</SizableText>
                </ButtonSimple>
              </XStack>

              <SizableText size="$2" text="center" color="$color9" px="$2">
                By continuing, you agree to our{' '}
                <Link href={TERMS_OF_SERVICE_URL}>Terms</Link>,{' '}
                <Link href={PRIVACY_POLICY_URL}>Privacy</Link> &{' '}
                <Link href={EULA_URL}>EULA</Link>
              </SizableText>
            </YStack>
          </GlassView>
        </View>
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
