import { useRouter } from 'one'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'
import { isNative } from '~/constants/platform'
import { useGoBackToHome } from '~/hooks/useGoBackToHome'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Sheet, type SheetRef } from '~/interface/sheet/Sheet'
import { MediumText } from '~/interface/text/Body'
import { showToast } from '~/interface/toast/helpers'
import { signInAsAdmin } from '../client/signInAsAdmin'

interface LoginSheetProps {
  onClose?: () => void
}

export interface LoginSheetRef extends SheetRef {
  expand: () => void
}

export const LoginSheet = forwardRef<LoginSheetRef, LoginSheetProps>(
  ({ onClose }, ref) => {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)

    const goBackToHome = useGoBackToHome()

    useImperativeHandle(ref, () => ({
      expand: () => setIsOpen(true),
      close: () => setIsOpen(false),
      collapse: () => setIsOpen(false),
    }))

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

    const openTermsOfService = () => {
      if (isNative) {
        router.push('/terms')
      } else {
        window.open('https://example.com/terms', '_blank')
      }
    }

    const openPrivacyPolicy = () => {
      if (isNative) {
        router.push('/privacy')
      } else {
        window.open('https://example.com/privacy', '_blank')
      }
    }

    const openEULA = () => {
      router.push('/eula')
    }

    // Only show sheet on native
    if (!isNative) {
      return null
    }

    return (
      <Sheet ref={ref} onClose={onClose} title="Get Started">
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
  }
)
