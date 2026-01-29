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
  const [showOnboarding, setShowOnboarding] = useState(() => !isWeb)

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
    <PageLayout useImage useInsets={false}>
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
              {loginButtons}
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
}
