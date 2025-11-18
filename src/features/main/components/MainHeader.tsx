import { Link } from 'one'
import { Popover, XStack, YStack } from 'tamagui'
import { useUser } from '~/features/user/useUser'
import { Logo } from '~/interface/app/Logo'
import { Avatar } from '~/interface/avatars/Avatar'
import { Pressable } from '~/interface/buttons/Pressable'
import { PageContainer } from '~/interface/layout/PageContainer'
import { ScrollHeader } from '~/interface/headers/ScrollHeader'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'
import { UserProfileEditPopover } from '../../user/ui/UserProfileEditPopover'
import { NavigationTabs } from './NavigationTabs'

export const MainHeader = () => {
  const { user } = useUser()

  return (
    <ScrollHeader>
      <PageContainer>
        <YStack width="100%" py="$2.5">
          <XStack width="100%" px="$6" items="center" justify="space-between">
            <XStack gap="$2" items="center">
              <Link href="/">
                <Logo />
              </Link>
            </XStack>

            <NavigationTabs />

            <XStack gap="$4" items="center">
              {user && (
                <Popover
                  size="$5"
                  allowFlip
                  stayInFrame
                  offset={15}
                  placement="bottom-end"
                >
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
                    <YStack width="100%" rounded="$6" overflow="hidden" flex={1}>
                      <UserProfileEditPopover />
                    </YStack>
                  </Popover.Content>
                </Popover>
              )}
              <ThemeSwitch size="$2" />
            </XStack>
          </XStack>
        </YStack>
      </PageContainer>
    </ScrollHeader>
  )
}
