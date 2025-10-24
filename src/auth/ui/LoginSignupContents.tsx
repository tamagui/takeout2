import { Mail } from '@tamagui/lucide-icons'
import { memo, useState } from 'react'
import { isClient, isWeb, YStack } from 'tamagui'
import { authClient, clearAuthClientToken } from '~/auth/client/authClient'
import { setLoginPopup } from '~/auth/client/AuthEffects'
import { openCenteredPopup } from '@vxrn/helpers'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { GithubLogoIcon } from '~/interface/icons/GithubLogoIcon'
import { showNotification } from '~/interface/notification/Notification'
import { showToast } from '~/interface/toast/Toast'
import { isTauri } from '@vxrn/helpers'

export const LoginSignupContents = memo(() => {
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleMagicLink = async () => {
    if (!email || isSending) return

    setIsSending(true)
    try {
      const result = await authClient.signIn.magicLink({
        email,
        callbackURL: window.location.origin,
      })

      if (result.error) {
        showNotification('Failed to send login link', {
          display: 'error',
          description: result.error.message,
        })
      } else {
        showToast('Check your email for the login link!')
        setEmail('')
      }
    } catch (error) {
      showNotification('Failed to send magic link', {
        display: 'error',
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
          // @ts-ignore
          type="submit"
          width="100%"
          size="medium"
          scaleIcon={1.2}
          icon={Mail}
          disabled={!email || isSending}
          onPress={handleMagicLink}
        >
          {isSending ? 'Sending...' : 'Send Login Link'}
        </ButtonSimple>
      </form>

      <TauriOpenNewWindowLoginLink>
        <ButtonSimple width="100%" size="medium" scaleIcon={1.3} icon={GithubLogoIcon}>
          Login with Github
        </ButtonSimple>
      </TauriOpenNewWindowLoginLink>

      {/* <ButtonSimple size="medium" scaleIcon={1.5} icon={AppleLogoIcon}>
        Login with Apple
      </ButtonSimple> */}

      {(process.env.NODE_ENV === 'development' ||
        (isClient && window.location.search.includes('showAdmin'))) && (
        <ButtonSimple
          width="100%"
          size="medium"
          // hide in production for now
          data-testid="login-as-admin"
          onPress={async () => {
            showToast(`Creating admin..`)

            const { error } = await authClient.signUp.email({
              name: `Admin`,
              email: `admin@start.chat`,
              password: `password123`,
            })

            // if already exists (422) just login
            if (error && error.status !== 422) {
              showNotification(error.statusText, {
                display: 'error',
                description: error.message,
              })
              return
            }

            const loginRes = await authClient.signIn.email({
              email: `admin@start.chat`,
              password: `password123`,
            })

            if (loginRes.error) {
              showNotification(loginRes.error.statusText, {
                display: 'error',
                description: loginRes.error.message,
              })
              return
            }

            window.location.reload()
          }}
        >
          Login as Admin
        </ButtonSimple>
      )}
    </YStack>
  )
})

export const TauriOpenNewWindowLoginLink = (props: { children: any }) => {
  if (!isWeb && !isTauri) {
    // TODO
    return props.children
  }

  return (
    <a
      target="_blank"
      href={window.location.origin + '/_/login-github?from-tauri'}
      style={{
        textDecoration: 'none',
      }}
      rel="noreferrer"
      onClick={(e) => {
        if (!isTauri) {
          e.preventDefault()

          const origin = window.location.origin

          // ensure we clear any stale info
          clearAuthClientToken()

          const popup = openCenteredPopup(origin + '/_/login-github', 'Login', 700, 800)
          if (popup) {
            e.preventDefault()
            setLoginPopup(popup)
          } else {
            // let it continue
          }
        }
      }}
      {...props}
    />
  )
}
