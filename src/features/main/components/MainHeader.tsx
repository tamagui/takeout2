import { Link, router } from 'one'
import { useState } from 'react'
import { Adapt, Button, H3, Separator, Sheet, Spacer, XStack, YStack } from 'tamagui'

import { useLogout } from '~/features/auth/useLogout'
import { useUser } from '~/features/user/useUser'
import { Logo } from '~/interface/app/Logo'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Pressable } from '~/interface/buttons/Pressable'
import { ScrollHeader } from '~/interface/headers/ScrollHeader'
import { DoorIcon } from '~/interface/icons/phosphor/DoorIcon'
import { GearIcon } from '~/interface/icons/phosphor/GearIcon'
import { ListIcon } from '~/interface/icons/phosphor/ListIcon'
import { PageContainer } from '~/interface/layout/PageContainer'
import { ListItem } from '~/interface/lists/ListItem'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'

import { UserProfilePopover } from '../../user/ui/UserProfilePopover'
import { NavigationTabs } from './NavigationTabs'

export const MainHeader = () => {
  const { user } = useUser()
  const [open, setOpen] = useState<boolean>(false)
  const { logout } = useLogout()

  const handleLogout = () => {
    logout()
    setOpen(false)
  }

  return (
    <ScrollHeader>
      <PageContainer>
        <YStack width="100%" py="$2.5">
          <XStack
            width="100%"
            px="$2"
            $sm={{ px: '$6' }}
            items="center"
            justify="space-between"
          >
            <XStack gap="$2" items="center">
              <Link href="/">
                <Logo />
              </Link>
              <Spacer width={70} $maxSM={{ width: 0 }} />
            </XStack>

            <NavigationTabs />

            {/* desktop controls */}
            <XStack gap="$4" items="center" display="none" $sm={{ display: 'flex' }}>
              {user && (
                <UserProfilePopover
                  trigger={
                    <Pressable cursor="pointer" items="center" justify="center">
                      <Avatar size={32} image={user.image} />
                    </Pressable>
                  }
                />
              )}

              <ThemeSwitch size="$2" />
              <ButtonSimple
                size="large"
                circular
                onPress={() => router.push('/settings')}
                icon={<GearIcon size={20} />}
              />
            </XStack>

            {/* mobile hamburger */}
            <Button
              size="$3"
              chromeless
              circular
              icon={ListIcon}
              aria-label="Menu"
              onPress={() => setOpen(true)}
              $sm={{ display: 'none' }}
            />

            <Adapt when="maxSM" platform="touch">
              <Sheet
                open={open}
                onOpenChange={setOpen}
                animation="medium"
                modal
                dismissOnSnapToBottom
                snapPoints={[50]}
              >
                <Sheet.Frame bg="$color2">
                  <YStack flex={1} gap="$2">
                    <XStack p="$4" pb="$3" justify="space-between" items="center">
                      <XStack gap="$3" items="center">
                        <Logo height={32} />
                      </XStack>
                      <ThemeSwitch />
                    </XStack>

                    <Separator />

                    <YStack flex={1}>
                      <Link href="/settings" asChild>
                        <ListItem onPress={() => setOpen(false)}>
                          <ListItem.Icon>
                            <GearIcon />
                          </ListItem.Icon>
                          <ListItem.Text>Settings</ListItem.Text>
                        </ListItem>
                      </Link>

                      <ListItem onPress={handleLogout}>
                        <ListItem.Icon>
                          <DoorIcon />
                        </ListItem.Icon>
                        <ListItem.Text>Logout</ListItem.Text>
                      </ListItem>
                    </YStack>

                    {user && (
                      <XStack p="$4" pt="$2" gap="$3" items="center">
                        <Avatar size={40} image={user.image} />
                        <YStack flex={1}>
                          <H3 size="$3" fontWeight="600">
                            {user.name || user.username}
                          </H3>
                        </YStack>
                      </XStack>
                    )}
                  </YStack>
                </Sheet.Frame>
                <Sheet.Overlay
                  animation="quick"
                  opacity={0.8}
                  enterStyle={{ opacity: 0 }}
                  exitStyle={{ opacity: 0 }}
                />
              </Sheet>
            </Adapt>
          </XStack>
        </YStack>
      </PageContainer>
    </ScrollHeader>
  )
}
