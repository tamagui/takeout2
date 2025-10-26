import { useRouter } from 'one'
import { useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H1, Text, YStack } from 'tamagui'
import { kWidth } from '~/interface/dimensions'
import { useAuth } from '../client/authClient'

export function Login() {
  const { top, bottom } = useSafeAreaInsets()
  const router = useRouter()
  const { state } = useAuth()
  const isLoggedIn = state === 'logged-in'

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/')
    }
  }, [isLoggedIn, router])

  return (
    <YStack flex={1} bg="$surface" items="center" justify="center" pt={top}>
      <YStack mb="$12">
        {/* logo at the top */}
        <YStack items="center" mb="$8">
          {/* <Image
            src={require('../../../../assets/logo.png')}
            width={60}
            height={60}
            mb="$4"
          /> */}
          <H1 color="$color" fontWeight="800">
            Welcome
          </H1>
          <Text fontSize="$5" color="$color10" mt="$2">
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
          <YStack width={kWidth - 64} py="$2" items="center" justify="center"></YStack>
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
}
