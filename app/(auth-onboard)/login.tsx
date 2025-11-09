import { LinearGradient } from '@tamagui/linear-gradient'
import { router } from 'one'
import { Linking } from 'react-native'
import {
  Circle,
  Separator,
  SizableText,
  Text,
  useWindowDimensions,
  View,
  XStack,
  YStack,
} from 'tamagui'
import { APP_NAME, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '~/constants/app'
import { isIos, isNative } from '~/constants/platform'
import { useOnboarding } from '~/features/onboarding/useOnboarding'
import { Logo } from '~/interface/app/Logo'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { dialogEmit } from '~/interface/dialogs/shared'
import Glint from '~/interface/effects/Glint'
import { AppleIcon } from '~/interface/icons/AppleIcon'
import { GoogleIcon } from '~/interface/icons/GoogleIcon'
import { H2 } from '~/interface/text/Headings'
import { showToast } from '~/interface/toast/helpers'

export const LoginPage = () => {
  useOnboarding()

  const { width } = useWindowDimensions()

  const handleSignInAdmin = async () => {
    dialogEmit({ type: 'admin-password' })
  }

  const handleContinueWithEmail = () => {
    router.push('/signup/email')
  }

  const openTermsOfService = () => {
    Linking.openURL(TERMS_OF_SERVICE_URL)
  }

  const openPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL)
  }

  const openEULA = () => {
    router.push('/eula')
  }

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    showToast(`${provider} login coming soon!`, { type: 'info' })
  }

  return (
    <View flex={1} bg="$color1">
      {/* Dark gradient background */}
      <LinearGradient
        colors={['#313131', 'transparent']}
        position="absolute"
        t={0}
        l={0}
        r={0}
        b={0}
        height={200}
      />
      <YStack flex={1} justify="center" items="center" px="$4">
        <YStack gap="$6" width="100%" items="center">
          <YStack
            animation="bouncy"
            enterStyle={{ scale: 0.9, opacity: 0 }}
            exitStyle={{ scale: 0.9, opacity: 0 }}
            items="center"
            gap="$2"
          >
            <Circle
              size={80}
              bg="$color2"
              animation="superLazy"
              enterStyle={{ scale: 0.5, opacity: 0 }}
              shadowColor="$color12"
              shadowOpacity={0.1}
              shadowRadius={20}
              borderWidth={0.5}
              borderColor="$color3"
              items="center"
              justify="center"
            >
              <Logo size={52} />
            </Circle>
            <YStack items="center" gap="$2">
              <H2
                text="center"
                color="$color12"
                animation="200ms"
                enterStyle={{ opacity: 0, y: -10 }}
              >
                Welcome back
              </H2>
            </YStack>
          </YStack>
          <YStack
            key="welcome-content"
            gap="$4"
            p="$5"
            items="center"
            width="100%"
            animation="medium"
            enterStyle={{ opacity: 0, y: 20 }}
            exitStyle={{ opacity: 0, y: -20 }}
            bg="$color1"
            borderWidth={1}
            borderColor="$color3"
            rounded="$8"
            shadowColor="$shadowColor"
            shadowOpacity={0.05}
            shadowRadius={10}
            position="relative"
            overflow="hidden"
          >
            <YStack width="100%" gap="$3">
              <ButtonSimple
                theme="accent"
                size="large"
                onPress={handleContinueWithEmail}
                width="100%"
                pressStyle={{
                  scale: 0.97,
                  opacity: 0.9,
                }}
                animation="200ms"
                enterStyle={{ opacity: 0, scale: 0.95 }}
              >
                Continue with Email
              </ButtonSimple>

              {!isNative && window.location.search.includes('showAdmin') && (
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
            <XStack
              width="100%"
              items="center"
              gap="$4"
              py="$2"
              animation="200ms"
              enterStyle={{ opacity: 0 }}
            >
              <Separator flex={1} borderColor="$color3" />
              <Text
                color="$color10"
                fontSize="$2"
                fontFamily="$mono"
                textTransform="uppercase"
                letterSpacing={1}
              >
                or
              </Text>
              <Separator flex={1} borderColor="$color3" />
            </XStack>
            <YStack width="100%" gap="$3">
              <ButtonSimple
                glass
                size="large"
                onPress={() => handleSocialLogin('google')}
                width="100%"
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
                borderWidth={1}
                borderColor="$color3"
              >
                Continue with Google
              </ButtonSimple>
              {isIos && (
                <ButtonSimple
                  glass
                  size="large"
                  onPress={() => handleSocialLogin('apple')}
                  width="100%"
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
                  borderWidth={1}
                  borderColor="$color3"
                >
                  Continue with Apple
                </ButtonSimple>
              )}
            </YStack>
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
                By continuing, you agree to {APP_NAME}'s
              </SizableText>
              <XStack justify="center" gap="$1">
                <SizableText
                  color="$color12"
                  textDecorationLine="underline"
                  onPress={openTermsOfService}
                  cursor="pointer"
                >
                  Terms of Service
                </SizableText>
                <SizableText color="$color11">,</SizableText>
                <SizableText
                  color="$color12"
                  textDecorationLine="underline"
                  onPress={openPrivacyPolicy}
                  cursor="pointer"
                >
                  Privacy Policy
                </SizableText>
                <SizableText color="$color11">and</SizableText>
                <SizableText
                  color="$color12"
                  textDecorationLine="underline"
                  onPress={openEULA}
                  cursor="pointer"
                >
                  EULA.
                </SizableText>
              </XStack>
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </View>
  )
}
