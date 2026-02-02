import { useCallback, useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatePresence, SizableText, View, YStack } from 'tamagui'

import { APP_NAME } from '~/constants/app'
import { LoginDemoButton } from '~/features/auth/ui/LoginDemoButton'
import { LoginEmailButton } from '~/features/auth/ui/LoginEmailButton'
import { LoginLegalText } from '~/features/auth/ui/LoginLegalText'
import { LoginSocialButtons } from '~/features/auth/ui/LoginSocialButtons'
import { Onboarding, onboardingStorage } from '~/features/onboarding'
import { GradientBackground } from '~/interface/backgrounds/GradientBackground'
import { GlassView } from '~/interface/effects/GlassView'
import { Image } from '~/interface/image/Image'
import { LiquidGlassTakeout } from '~/interface/liquid-glass/LiquidGlassTakeout'

export const LoginPage = () => {
  const insets = useSafeAreaInsets()
  // for demo always show
  const [showOnboarding, setShowOnboarding] = useState(() => true)
  const [showLiquidGlassTakeout, setShowLiquidGlassTakeout] = useState(false)

  const handleOnboardingComplete = useCallback(() => {
    onboardingStorage.set(true)
    setShowOnboarding(false)
  }, [])

  useEffect(() => {
    setTimeout(() => {
      setShowLiquidGlassTakeout(true)
    }, 1000)
  }, [])

  return (
    <>
      {showLiquidGlassTakeout && <LiquidGlassTakeout />}
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
                fontFamily="$heading"
                text="center"
                color="$color12"
                fontWeight="700"
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
                <LoginEmailButton />
                <LoginDemoButton />
                <LoginSocialButtons />
                <LoginLegalText />
              </YStack>
            </GlassView>
          </View>
        </View>

        {/* <AnimatePresence>
        {showOnboarding && (
          <View
            transition="200ms"
            position="absolute"
            t={0}
            l={0}
            r={0}
            b={0}
            z={1000}
            opacity={1}
            enterStyle={{ scale: 0.95 }}
            exitStyle={{ scale: 0.85, opacity: 0 }}
          >
            <Onboarding onComplete={handleOnboardingComplete} />
          </View>
        )}
      </AnimatePresence> */}
      </GradientBackground>
    </>
  )
}
