import { router } from 'one'
import {
  Separator,
  SizableText,
  Text,
  useWindowDimensions,
  XStack,
  YStack,
} from 'tamagui'
import { images } from '~/constants/images'
import { isIos, isNative } from '~/constants/platform'
import { signInAsAdmin } from '~/features/auth/client/signInAsAdmin'
import { useOnboarding } from '~/features/onboarding/useOnboarding'
import { getHumanReadableVersionString } from '~/helpers/getHumanReadableVersionString'
import { useGoBackToHome } from '~/helpers/useGoBackToHome'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { AppleIcon } from '~/interface/icons/AppleIcon'
import { GoogleIcon } from '~/interface/icons/GoogleIcon'
import { Image } from '~/interface/image/Image'
import { H1 } from '~/interface/text/Headings'
import { showToast } from '~/interface/toast/helpers'

export const LoginPage = () => {
  useOnboarding()

  const { width } = useWindowDimensions()

  const goBackToHome = useGoBackToHome()

  const handleSignInAdmin = async () => {
    const res = await signInAsAdmin()
    if (res.success) {
      showToast(`Signed in!`, { type: 'info' })
      goBackToHome()
    } else {
      console.error(res.error)
      showToast(`Error!`, { type: 'error' })
    }
  }

  const handleContinueWithEmail = () => {
    router.push('/signup/email')
  }

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    showToast(`${provider} login coming soon!`, { type: 'info' })
  }

  return (
    <YStack
      flex={1}
      justify="center"
      gap="$4"
      width={width * 0.8}
      maxW="90%"
      self="center"
      items="stretch"
    >
      <YStack
        key="welcome-content"
        gap="$2"
        items="center"
        width="100%"
        animation="medium"
        enterStyle={{ opacity: 0, y: -20 }}
        exitStyle={{ opacity: 0, y: 20 }}
      >
        <YStack
          animation="200ms"
          enterStyle={{ scale: 0.5, opacity: 0 }}
          exitStyle={{ scale: 0.5, opacity: 0 }}
          items="center"
          gap="$3"
        >
          <Image src={images.iconTakeout} width={80} height={80} />
          <H1 size="$9" fontFamily="$heading" text="center" color="$color">
            Welcome back!
          </H1>
        </YStack>

        {/* Email Login Form */}
        <YStack width="100%" gap="$3">
          <ButtonSimple
            glass
            size="large"
            onPress={handleContinueWithEmail}
            width="100%"
            bg="transparent"
            pressStyle={{
              scale: 0.98,
            }}
          >
            Continue with Email
          </ButtonSimple>
          {/* In dev mode - admin sign on visible */}
          {(process.env.NODE_ENV === 'development' ||
            (!isNative && window.location.search.includes('showAdmin'))) && (
            <ButtonSimple
              theme="accent"
              size="large"
              onPress={handleSignInAdmin}
              width="100%"
              pressStyle={{
                scale: 0.98,
              }}
            >
              Continue as admin (dev)
            </ButtonSimple>
          )}
        </YStack>

        {/* Divider */}
        <XStack width="100%" items="center" gap="$3" py="$2">
          <Separator flex={1} />
          <Text color="$color9" fontSize="$3" fontFamily="$mono">
            OR
          </Text>
          <Separator flex={1} />
        </XStack>

        {/* Social Login Buttons */}
        <YStack width="100%" gap="$3" enterStyle={{ opacity: 0 }}>
          <ButtonSimple
            glass
            size="large"
            onPress={() => handleSocialLogin('google')}
            width="100%"
            pressStyle={{
              scale: 0.98,
            }}
            icon={<GoogleIcon size={16} />}
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
                scale: 0.98,
              }}
              icon={<AppleIcon size={20} />}
            >
              Continue with Apple
            </ButtonSimple>
          )}
        </YStack>
      </YStack>

      {isNative && (
        <YStack opacity={0.5} items="center">
          <SizableText size="$1" color="$color8">
            {getHumanReadableVersionString()}
          </SizableText>
        </YStack>
      )}
    </YStack>
  )
}
