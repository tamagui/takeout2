import { Spacer } from 'tamagui'
import { Circle, XStack, YStack } from 'tamagui'

import { LoginAdminButton } from '~/features/auth/ui/LoginAdminButton'
import { LoginDemoButton } from '~/features/auth/ui/LoginDemoButton'
import { LoginEmailButton } from '~/features/auth/ui/LoginEmailButton'
import { LoginLegalText } from '~/features/auth/ui/LoginLegalText'
import { LoginSocialButtons } from '~/features/auth/ui/LoginSocialButtons'
import { LogoIcon } from '~/interface/app/LogoIcon'
import { H2 } from '~/interface/text/Headings'

export const LoginPage = () => {
  return (
    <XStack flex={1} flexBasis="auto" position="relative">
      <YStack flex={1} justify="center" items="center">
        <Circle
          size={72}
          background="$color1"
          transition="medium"
          enterStyle={{ scale: 0.95, opacity: 0 }}
        >
          <LogoIcon size={38} />
        </Circle>

        <Spacer flex={1} />

        <YStack
          gap="$4"
          width="100%"
          items="center"
          bg="$background"
          rounded="$8"
          p="$2"
          $md={{ p: '$6' }}
        >
          <H2 size="$7" text="center">
            Login
          </H2>

          <YStack
            key="welcome-content"
            gap="$4"
            items="center"
            width="100%"
            transition="medium"
            enterStyle={{ opacity: 0, y: 10 }}
            exitStyle={{ opacity: 0, y: -10 }}
            position="relative"
            overflow="hidden"
          >
            <YStack width="100%" gap="$4">
              <LoginEmailButton />

              <LoginAdminButton />

              <LoginDemoButton />
              <LoginSocialButtons />
              <LoginLegalText />
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </XStack>
  )
}
