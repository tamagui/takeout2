import { useCallback, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  AnimatePresence,
  Circle,
  isWeb,
  SizableText,
  View,
  XStack,
  YStack,
} from 'tamagui'

import { APP_NAME } from '~/constants/app'
import { LoginAdminButton } from '~/features/auth/ui/LoginAdminButton'
import { LoginDemoButton } from '~/features/auth/ui/LoginDemoButton'
import { LoginEmailButton } from '~/features/auth/ui/LoginEmailButton'
import { LoginLegalText } from '~/features/auth/ui/LoginLegalText'
import { LoginSocialButtons } from '~/features/auth/ui/LoginSocialButtons'
import { Onboarding, onboardingStorage } from '~/features/onboarding'
import { LogoIcon } from '~/interface/app/LogoIcon'
import { GlassView } from '~/interface/effects/GlassView'
import { Image } from '~/interface/image/Image'
import { PageLayout } from '~/interface/pages/PageLayout'
import { H2 } from '~/interface/text/Headings'

export const LoginPage = () => {
  const insets = useSafeAreaInsets()
  // skip onboarding if already completed, or on web
  const [showOnboarding, setShowOnboarding] = useState(
    () => !isWeb && !onboardingStorage.get(),
  )

  const handleOnboardingComplete = useCallback(() => {
    onboardingStorage.set(true)
    setShowOnboarding(false)
  }, [])

  const loginButtons = (
    <>
      <LoginEmailButton />
      {isWeb && <LoginAdminButton />}
      <LoginDemoButton />
      <LoginSocialButtons />
      <LoginLegalText />
    </>
  )

  if (isWeb) {
    return (
      <XStack flex={1} flexBasis="auto" position="relative">
        <YStack flex={1} justify="center" items="center">
          <Circle size={72} transition="medium" enterStyle={{ scale: 0.95, opacity: 0 }}>
            <LogoIcon size={38} />
          </Circle>

          <YStack
            gap="$4"
            width="100%"
            items="center"
            bg="$background"
            rounded="$8"
            p="$4"
            $md={{ p: '$6' }}
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
                {loginButtons}
              </YStack>
            </YStack>
          </YStack>
        </YStack>
      </XStack>
    )
  }

  return (
    <YStack flex={1} items="center" justify="center" gap="$4" px="$6" pt={insets.top}>
      <SizableText size="$9" fontWeight="700" color="$color12">
        {APP_NAME}
      </SizableText>
      <SizableText size="$4" color="$color10" text="center">
        Sign in to continue to your account
      </SizableText>
      <YStack width="100%" gap="$4" mt="$4">
        {loginButtons}
      </YStack>
    </YStack>
  )
}

/* original onboarding overlay — disabled while debugging native render
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
            opacity={1}
            enterStyle={{ scale: 0.95 }}
            exitStyle={{ scale: 0.85, opacity: 0 }}
          >
            <Onboarding onComplete={handleOnboardingComplete} />
          </View>
        )}
      </AnimatePresence>
    </PageLayout>
  )
*/
