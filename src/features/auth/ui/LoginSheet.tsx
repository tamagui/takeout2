import { useRouter } from 'one'
import { forwardRef, useImperativeHandle } from 'react'
import { SizableText, useEvent, XStack, YStack } from 'tamagui'
import { isNative } from '~/constants/platform'
import { useGoBackToHome } from '~/helpers/useGoBackToHome'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Sheet, type SheetRef } from '~/interface/sheet/Sheet'
import { MediumText } from '~/interface/text/Body'
import { showToast } from '~/interface/toast/helpers'
import { signInAsAdmin } from '../client/signInAsAdmin'

export interface LoginSheetRef extends SheetRef {
  expand: () => void
}

export const LoginSheet = forwardRef<LoginSheetRef>((_, ref) => {
  const router = useRouter()
  const goBackToHome = useGoBackToHome()

  useImperativeHandle(ref, () => ({
    expand: () => {},
    close: () => {},
    collapse: () => {},
  }))

  const handleSignInAdmin = useEvent(async () => {
    const res = await signInAsAdmin()
    if (res.success) {
      showToast(`Signed in!`, { type: 'info' })
      goBackToHome()
    } else {
      console.info('Sign in error:', res.error)
      showToast(`Error!`, { type: 'error' })
    }
  })

  const handleContinueWithEmail = useEvent(() => {
    router.push('/signup/email')
  })

  const openTermsOfService = useEvent(() => {
    if (isNative) {
      router.push('/terms')
    } else {
      window.open('https://example.com/terms', '_blank')
    }
  })

  const openPrivacyPolicy = useEvent(() => {
    if (isNative) {
      router.push('/privacy')
    } else {
      window.open('https://example.com/privacy', '_blank')
    }
  })

  const openEULA = useEvent(() => {
    router.push('/eula')
  })

  // Only show sheet on native
  if (!isNative) {
    return null
  }

  return (
    <Sheet ref={ref} title="Get Started">
      {/* Sign in options */}
      <YStack gap={8} flex={1}>
        <YStack gap={8} flex={1}>
          <ButtonSimple size="large" variant="default" onPress={handleContinueWithEmail}>
            Continue with Email
          </ButtonSimple>

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
})
