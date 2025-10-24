import { useRouter } from 'one'
import { memo, useCallback, useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Spinner, Text, useTheme, View, YStack } from 'tamagui'
import { kWidth } from '~/constants/deviceSizes'
import { Logo } from '~/interface/app/Logo'
import { AppleLogoIcon } from '~/interface/icons/AppleLogoIcon'
import { GithubLogoIcon } from '~/interface/icons/GithubLogoIcon'
import { GlassView } from '~/interface/view/GlassView'
import { authClient, useAuth } from '../client/authClient'

export const Login = memo(function Login() {
  const { top, bottom } = useSafeAreaInsets()
  const router = useRouter()
  const { color } = useTheme()
  const { state } = useAuth()
  const [githubLoading, setGithubLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)

  const handleGithubLogin = useCallback(async () => {
    setGithubLoading(true)
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/_/login-success',
      })
    } catch (error) {
    } finally {
      setGithubLoading(false)
    }
  }, [])

  const handleAppleLogin = useCallback(async () => {
    setAppleLoading(true)
    try {
      // mock apple login for now
      console.info('Apple login not yet implemented')
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } finally {
      setAppleLoading(false)
    }
  }, [])

  useEffect(() => {
    if (state === 'logged-in') {
      router.replace('/')
    }
  }, [state, router])

  return (
    <YStack flex={1} bg="$surface" items="center" justify="center" pt={top}>
      <YStack mb="$12">
        {/* logo at the top */}
        <YStack items="center" mb="$8">
          <Logo size={60} mb="$4" />
          <H1 color="$color" fontFamily="$mono" fontWeight="800">
            Welcome to Start.Chat
          </H1>
          <Text fontSize="$5" color="$color10" mt="$2" fontFamily="$mono">
            Login in to continue
          </Text>
        </YStack>

        {/* login buttons */}
        <YStack
          animation="medium"
          enterStyle={{ opacity: 1, y: 30 }}
          exitStyle={{ opacity: 0, y: 30 }}
          opacity={1}
          y={0}
          gap="$2"
          p="$2"
          items="center"
        >
          <GlassView borderRadius={16}>
            <YStack width={kWidth - 64} py="$2" items="center" justify="center">
              <Button
                fontFamily="$mono"
                scaleIcon={1.5}
                bg="transparent"
                width="100%"
                rounded={16}
                onPress={handleGithubLogin}
                disabled={githubLoading}
              >
                <View
                  animation="bouncy"
                  flexDirection="row"
                  x={githubLoading ? 0 : -15}
                  gap="$3"
                  items="center"
                  justify="center"
                >
                  <Button.Icon>
                    <Spinner
                      animation="medium"
                      enterStyle={{
                        scale: 0,
                      }}
                      exitStyle={{
                        scale: 0,
                      }}
                      opacity={githubLoading ? 1 : 0}
                    />
                  </Button.Icon>
                  {!githubLoading && <GithubLogoIcon width={24} height={24} />}
                  <Button.Text fontWeight="600">Login with Github</Button.Text>
                </View>
              </Button>
            </YStack>
          </GlassView>

          <GlassView borderRadius={16}>
            <YStack width={kWidth - 64} py="$2" items="center" justify="center">
              <Button
                fontFamily="$mono"
                scaleIcon={1.5}
                bg="transparent"
                width="100%"
                rounded={16}
                onPress={handleAppleLogin}
                disabled={appleLoading}
              >
                <View
                  animation="bouncy"
                  flexDirection="row"
                  x={appleLoading ? 0 : -15}
                  gap="$3"
                  items="center"
                  justify="center"
                >
                  <Button.Icon>
                    <Spinner
                      animation="medium"
                      enterStyle={{
                        scale: 0,
                      }}
                      exitStyle={{
                        scale: 0,
                      }}
                      opacity={appleLoading ? 1 : 0}
                    />
                  </Button.Icon>
                  {!appleLoading && (
                    <AppleLogoIcon
                      width={24}
                      height={24}
                      // size={16}
                      // color={color.val}
                      // style={{ marginBottom: 2 }}
                    />
                  )}
                  <Button.Text fontWeight="600">Login with Apple</Button.Text>
                </View>
              </Button>
            </YStack>
          </GlassView>
        </YStack>
      </YStack>

      {/* footer text */}
      <Text
        text="center"
        fontSize="$2"
        color="$color10"
        position="absolute"
        px="$2"
        b={bottom + 16}
      >
        By signing in, you agree to our Terms and Privacy Policy
      </Text>
    </YStack>
  )
})
