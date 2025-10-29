import { useState } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'
import { authClient } from '~/features/auth/client/authClient'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { EnvelopeIcon } from '~/interface/icons/phosphor/EnvelopeIcon'
import { showToast } from '~/interface/toast/helpers'
import { Logo } from '~/interface/brand/Logo'
import { getHumanReadableVersionString } from '~/helpers/getHumanReadableVersionString'
import { RepeatedTapToShowDevTools } from '~/interface/interactions/RepeatedTapToShowDevTools'
import { signInAsAdmin } from '../client/signInAsAdmin'
import { useOnboarding } from '~/features/onboarding/useOnboarding'
import { isNative } from '~/constants/platform'

export const LoginSignupContents = () => {
  useOnboarding()

  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)

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
          data-testid="email-input"
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
          data-testid="send-magic-link-button"
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
          data-testid="login-as-admin"
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
