import { useRouter } from 'one'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'
import { useOnboarding } from '~/contexts/OnboardingContext'
import { FEATURE_FLAGS } from '~/features/feature-flags'
import { useGoBackToHome } from '~/hooks/useGoBackToHome'
import { useStatsig } from '~/features/feature-flags/usePostHog'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { AppleIcon } from '~/interface/icons/AppleIcon'
import { GoogleIcon } from '~/interface/icons/GoogleIcon'
import { Sheet, type SheetRef } from '~/interface/sheet/Sheet'
import { showToast } from '~/interface/toast/helpers'
import { signInAsAdmin } from '../actions/signInAsAdmin'
import { MediumText } from '~/interface/text/Body'
import { isNative } from '~/helpers/constants'

interface LoginSheetProps {
  onClose?: () => void
}

export interface LoginSheetRef extends SheetRef {
  expand: () => void
}

export const LoginSheet = forwardRef<LoginSheetRef, LoginSheetProps>(
  ({ onClose }, ref) => {
    const router = useRouter()
    const { setSignupMethod } = useOnboarding()
    const statsig = useStatsig()
    const [isOpen, setIsOpen] = useState(false)

    const goBackToHome = useGoBackToHome()

    // get feature flags for login methods
    const features = {
      showSocialLogin: statsig.checkGate(FEATURE_FLAGS.AUTH_ENABLE_SOCIAL_LOGIN),
      showPhoneLogin: statsig.checkGate(FEATURE_FLAGS.AUTH_ENABLE_PHONE_LOGIN),
    }

    useImperativeHandle(ref, () => ({
      expand: () => setIsOpen(true),
      close: () => setIsOpen(false),
      collapse: () => setIsOpen(false),
    }))

    const handleSignInWithPhone = () => {
      setSignupMethod('phone')
      router.push('/signup/phone')
    }

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

    const handleSignInWithApple = async () => {
      showToast('Signing in as admin...')
      // Apple sign-in will be handled differently (not through signup screen)
      setSignupMethod('social')
      // TODO: Implement Apple sign-in
    }

    const handleSignInWithGoogle = () => {
      // Google sign-in will be handled differently (not through signup screen)
      setSignupMethod('social')
      console.info('Sign in with Google')
      goBackToHome()
    }

    const handleContinueWithEmail = () => {
      setSignupMethod('email')
      router.push('/signup/email')
    }

    const openTermsOfService = () => {
      if (isNative) {
        // TODO: Handle native link opening
        router.push('/terms')
      } else {
        window.open('https://example.com/terms', '_blank')
      }
    }

    const openPrivacyPolicy = () => {
      if (isNative) {
        // TODO: Handle native link opening
        router.push('/privacy')
      } else {
        window.open('https://example.com/privacy', '_blank')
      }
    }

    const openEULA = () => {
      router.push('/eula')
    }

    const mainLoginMethod = (() => {
      let method = 'phone'
      if (!features.showPhoneLogin) {
        method = 'email'
      }
      return method
    })()

    // Only show sheet on native
    if (!isNative) {
      return null
    }

    return (
      <Sheet ref={ref} onClose={onClose} title="Get Started">
        {/* Sign in options */}
        <YStack gap={8} flex={1}>
          <YStack gap={8} flex={1}>
            {mainLoginMethod === 'phone' && features.showPhoneLogin && (
              <ButtonSimple
                size="large"
                variant="default"
                onPress={handleSignInWithPhone}
              >
                Continue with Phone
              </ButtonSimple>
            )}

            {mainLoginMethod === 'email' && (
              <ButtonSimple
                size="large"
                variant="default"
                onPress={handleContinueWithEmail}
              >
                Continue with Email
              </ButtonSimple>
            )}

            {features.showSocialLogin && (
              <>
                <ButtonSimple
                  size="large"
                  variant="default"
                  icon={AppleIcon}
                  onPress={handleSignInWithApple}
                >
                  Continue with Apple
                </ButtonSimple>

                <ButtonSimple
                  size="large"
                  variant="outlined"
                  icon={GoogleIcon}
                  onPress={handleSignInWithGoogle}
                >
                  Continue with Google
                </ButtonSimple>
              </>
            )}

            {mainLoginMethod === 'phone' && features.showPhoneLogin && (
              <ButtonSimple
                size="large"
                variant="outlined"
                onPress={handleContinueWithEmail}
              >
                Use email instead
              </ButtonSimple>
            )}

            {process.env.NODE_ENV === 'development' && (
              <ButtonSimple size="large" variant="subtle" onPress={handleSignInAdmin}>
                Sign in as Admin (Dev)
              </ButtonSimple>
            )}
          </YStack>

          {/* Terms */}
          <YStack gap="$2" items="center" pb="$4">
            <MediumText size="$1" color="$color8" text="center">
              By using our app, you agree to our
            </MediumText>
            <XStack gap="$1" items="center" flexWrap="wrap" justify="center">
              <MediumText
                size="$1"
                color="$color10"
                textDecorationLine="underline"
                onPress={openTermsOfService}
                cursor="pointer"
              >
                Terms of Service
              </MediumText>
              <SizableText size="$1" color="$color8">
                &
              </SizableText>
              <MediumText
                size="$1"
                color="$color10"
                textDecorationLine="underline"
                onPress={openPrivacyPolicy}
                cursor="pointer"
              >
                Privacy Policy
              </MediumText>
            </XStack>
            <MediumText
              size="$1"
              color="$color10"
              textDecorationLine="underline"
              onPress={openEULA}
              cursor="pointer"
            >
              End User License Agreement
            </MediumText>
          </YStack>
        </YStack>
      </Sheet>
    )
  }
)
