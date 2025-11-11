import { Link } from 'one'
import { Button, Popover, Spacer, XStack, YStack, isWeb } from 'tamagui'
import { useUser } from '~/features/user/useUser'
import { Logo } from '~/interface/app/Logo'
import { Avatar } from '~/interface/avatars/Avatar'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'
import { NavigationTabs } from './NavigationTabs'
import { UserProfileEditPopover } from '../../user/ui/UserProfileEditPopover'
import { Pressable } from '~/interface/buttons/Pressable'

export const MainHeader = () => {
  const { user } = useUser()

  return (
    <YStack
      py="$3"
      px="$4"
      bg="$background"
      shadowColor="$color2"
      shadowOffset={{ width: 0, height: 1 }}
      shadowOpacity={0.25}
      shadowRadius={3.84}
    >
      <XStack items="center" justify="space-between" maxW={1200} width="100%" mx="auto">
        <XStack gap="$2" items="center">
          <Link href="/">
            <Logo />
          </Link>
        </XStack>

        <NavigationTabs />

        <XStack gap="$2" items="center">
          <ThemeSwitch size="$2" />

          {user && (
            <Popover size="$5" allowFlip stayInFrame offset={15} placement="bottom-end">
              <Popover.Trigger asChild>
                <Pressable cursor="pointer" items="center" justify="center">
                  <Avatar size={32} image={user.image} />
                </Pressable>
              </Popover.Trigger>

              <Popover.Content
                animation="medium"
                bg="$color3"
                maxH="90vh"
                maxW={360}
                minW={320}
                elevation="$2"
                borderWidth={3}
                borderColor="$color2"
                p={0}
                rounded="$6"
                opacity={1}
                y={0}
                enterStyle={{
                  y: 3,
                  opacity: 0,
                }}
                exitStyle={{
                  y: 5,
                  opacity: 0,
                }}
              >
                <YStack
                  width="100%"
                  rounded="$6"
                  overflow="hidden"
                  height="100%"
                  flex={1}
                >
                  <UserProfileEditPopover />
                </YStack>
              </Popover.Content>
            </Popover>
          )}
        </XStack>
      </XStack>
    </YStack>
  )
}
