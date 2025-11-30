import { LinearGradient } from '@tamagui/linear-gradient'
import { router } from 'one'
import { Circle, isWeb, SizableText, XStack, YStack } from 'tamagui'
import { EULA_URL, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '~/constants/app'
import { Link } from '~/interface/app/Link'
import { Logo } from '~/interface/app/Logo'
import { ButtonAction } from '~/interface/buttons/ButtonAction'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { dialogEmit } from '~/interface/dialogs/shared'
import Glint from '~/interface/effects/Glint'
import { AppleIcon } from '~/interface/icons/AppleIcon'
import { GoogleIcon } from '~/interface/icons/GoogleIcon'
import { FacebookLogoIcon } from '~/interface/icons/phosphor/FacebookLogoIcon'
import { H2 } from '~/interface/text/Headings'
import { showToast } from '~/interface/toast/helpers'

export const LoginPage = () => {
  const handleSignInAdmin = () => {
    dialogEmit({ type: 'admin-password' })
    router.replace('/home')
  }

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
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
          mb="$4"
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
          <Logo size={42} />
        </Circle>

        <YStack
          gap="$4"
          width="100%"
          items="center"
          bg="$background"
          rounded="$8"
          p={isWeb ? '$6' : '$4'}
          maxW={isWeb ? 400 : '90%'}
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.08}
          shadowRadius={10}
          elevation="$4"
        >
          <Glint rounded="$8" />
          <YStack
            animation="bouncy"
            enterStyle={{ scale: 0.9, opacity: 0 }}
            exitStyle={{ scale: 0.9, opacity: 0 }}
            items="center"
            gap="$2"
          >
            <YStack items="center" gap="$2">
              <H2
                text="center"
                color="$color12"
                animation="200ms"
                enterStyle={{ opacity: 0, y: -10 }}
              >
                Welcome
              </H2>
            </YStack>
          </YStack>
          <YStack
            key="welcome-content"
            gap="$4"
            items="center"
            width="100%"
            animation="medium"
            enterStyle={{ opacity: 0, y: 20 }}
            exitStyle={{ opacity: 0, y: -20 }}
            shadowColor="$shadowColor"
            shadowOpacity={0.05}
            shadowRadius={10}
            position="relative"
            overflow="hidden"
          >
            <YStack width="100%" gap="$3">
              <Link href="/signup/email" asChild>
                <ButtonAction
                  glass
                  size="large"
                  width="100%"
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
                onPress={() => handleSocialLogin('facebook')}
                pressStyle={{
                  scale: 0.97,
                  bg: '$color2',
                }}
                hoverStyle={{
                  bg: '$color2',
                }}
                animation="200ms"
                enterStyle={{ opacity: 0, scale: 0.95 }}
                icon={<FacebookLogoIcon size={20} />}
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
