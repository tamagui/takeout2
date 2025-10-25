import { useState, useRef } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'
import { authClient } from '~/auth/client/authClient'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { EnvelopeIcon } from '~/interface/icons/phosphor/EnvelopeIcon'
import { showToast } from '~/interface/toast/helpers'
import { Image } from '~/interface/image/Image'
import { Logo } from '~/interface/brand/Logo'
import { images } from '~/constants/images'
import { getHumanReadableVersionString } from '~/helpers/getHumanReadableVersionString'
import { RepeatedTapToShowDevTools } from '~/interface/interactions/RepeatedTapToShowDevTools'
import { signInAsAdmin } from '../actions/signInAsAdmin'
import { useAfterLoginRedirect } from '../hooks/useAfterLoginRedirect'
import { LoginSheet } from './LoginSheet'
import { isNative } from '~/helpers/constants'

export const LoginSignupContents = () => {
  useAfterLoginRedirect()

  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const loginSheetRef = useRef<any>(null)

  const handleMagicLink = async () => {
    if (!email || isSending) return

    setIsSending(true)
    try {
      const result = await authClient.signIn.magicLink({
        email,
        callbackURL: isNative ? undefined : window.location.origin,
      })

      if (result.error) {
        showToast('Failed to send login link', {
          type: 'error',
          description: result.error.message,
        })
      } else {
        showToast('Check your email for the login link!')
        setEmail('')
      }
    } catch (error) {
      showToast('Failed to send magic link', {
        type: 'error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleGetStarted = () => {
    if (isNative && loginSheetRef.current?.expand) {
      loginSheetRef.current.expand()
    }
  }

  // Native-style layout with background image
  if (isNative) {
    return (
      <YStack flex={1}>
        <YStack flex={1} fullscreen opacity={1}>
          <Image
            src={images.blurBlackground}
            objectFit="cover"
            width="100%"
            height="100%"
          />
        </YStack>

        {/* Group friends photo */}
        <YStack self="center" pt="$4">
          <Image src={images.group} width={300} height={280} objectFit="contain" />
        </YStack>

        <YStack flex={1} overflow="visible" items="center" transform="translateY(-10%)">
          <YStack gap="$5" items="center" flex={1}>
            <XStack items="center">
              <LogoWithTapTrigger />
            </XStack>
            <SizableText text="center" fontSize={34} lineHeight={34} fontWeight="600">
              {`Chat, create, and earn\nwith AI content`}
            </SizableText>
          </YStack>

          <ButtonSimple
            width="90%"
            size="large"
            variant="default"
            onPress={handleGetStarted}
          >
            <ButtonSimple.Text>Get Started</ButtonSimple.Text>
          </ButtonSimple>

          <YStack opacity={0.5} pb="$2">
            <SizableText size="$1" color="$color8" mt="$2">
              {getHumanReadableVersionString()}
            </SizableText>
          </YStack>
        </YStack>

        <LoginSheet ref={loginSheetRef} />
      </YStack>
    )
  }

  // Web-style simple form layout
  return (
    <YStack
      flex={1}
      justify="center"
      gap="$4"
      width={300}
      maxW="90%"
      self="center"
      items="stretch"
    >
      <YStack items="center" mb="$4">
        <LogoWithTapTrigger />
      </YStack>

      <form
        style={{
          display: 'contents',
        }}
        onSubmit={(e) => {
          e.preventDefault()
          handleMagicLink()
        }}
      >
        <Input
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          disabled={isSending}
        />

        <ButtonSimple
          // @ts-expect-error - type prop for web forms
          type="submit"
          width="100%"
          size="large"
          scaleIcon={1.2}
          icon={EnvelopeIcon}
          disabled={!email || isSending}
          onPress={handleMagicLink}
        >
          {isSending ? 'Sending...' : 'Send Login Link'}
        </ButtonSimple>
      </form>

      {(process.env.NODE_ENV === 'development' ||
        (!isNative && window.location.search.includes('showAdmin'))) && (
        <ButtonSimple
          width="100%"
          size="small"
          variant="outlined"
          onPress={() => signInAsAdmin()}
        >
          Sign in as admin
        </ButtonSimple>
      )}

      <YStack opacity={0.5} items="center">
        <SizableText size="$1" color="$color8">
          {getHumanReadableVersionString()}
        </SizableText>
      </YStack>
    </YStack>
  )
}

function LogoWithTapTrigger() {
  return (
    <RepeatedTapToShowDevTools>
      {({ handleTap }: { handleTap: () => void }) => (
        <XStack onPress={handleTap}>
          <Logo />
        </XStack>
      )}
    </RepeatedTapToShowDevTools>
  )
}
