import { Link, router, usePathname } from 'one'
import { memo, useState } from 'react'
import { H3, Separator, Sheet, Spacer, View, XStack, YStack } from 'tamagui'

import { useLogout } from '~/features/auth/useLogout'
import { useUser } from '~/features/user/useUser'
import { Logo } from '~/interface/app/Logo'
import { Avatar } from '~/interface/avatars/Avatar'
import { Button } from '~/interface/buttons/Button'
import { ScrollHeader } from '~/interface/headers/ScrollHeader'
import { DoorIcon } from '~/interface/icons/phosphor/DoorIcon'
import { GearIcon } from '~/interface/icons/phosphor/GearIcon'
import { ListIcon } from '~/interface/icons/phosphor/ListIcon'
import { PageContainer } from '~/interface/layout/PageContainer'
import { ListItem } from '~/interface/lists/ListItem'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'

import { UserProfilePopover } from '../user/ui/UserProfilePopover'
import { NavigationTabs } from './NavigationTabs'

export const MainHeader = () => {
  const { user } = useUser()
  const pathname = usePathname()
  const isOnSettings = pathname.startsWith('/home/settings')

  return (
    <ScrollHeader>
      <PageContainer>
        <YStack w="100%" py="2">
          <XStack position="relative" w="100%" px="2" items="center">
            <XStack gap="2" items="center">
              <Link href="/" aria-label="Home">
                <Logo />
              </Link>
            </XStack>

            <Spacer flex={1} />

            <XStack
              position="absolute"
              inset={0}
              pointerEvents="none"
              items="center"
              justify="center"
              display="none lg:flex"
            >
              <View pointerEvents="auto">
                <NavigationTabs />
              </View>
            </XStack>

            <XStack gap="2-5" items="center" display="none md:flex">
              {user && (
                <UserProfilePopover
                  trigger={
                    <Button size="medium" circular cursor="pointer">
                      <Avatar
                        size={28}
                        image={user.image}
                        name={user.name ?? user.username ?? 'User'}
                      />
                    </Button>
                  }
                />
              )}

              <ThemeSwitch />
              <Button
                size="medium"
                circular
                onPress={() => router.push('/home/settings')}
                icon={<GearIcon size={18} />}
                aria-label="Settings"
                disabled={isOnSettings}
              />
            </XStack>

            <MainHeaderMenu />
          </XStack>
        </YStack>
      </PageContainer>
    </ScrollHeader>
  )
}

export const MainHeaderMenu = memo(() => {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const { logout } = useLogout()

  const handleLogout = () => {
    logout()
    setOpen(false)
  }
  return (
    <>
      <Button
        size="large"
        variant="transparent"
        circular
        icon={<ListIcon size="$1" />}
        aria-label="Menu"
        onPress={() => setOpen(true)}
        display="md:none"
      />
      <Sheet
        open={open}
        onOpenChange={setOpen}
        transition="quickLessBouncy"
        modal
        dismissOnSnapToBottom
        snapPoints={[50]}
      >
        <Sheet.Overlay bg="background" opacity="0.5 enter:0 exit:0" transition="quick" />
        <Sheet.Container bg="color2" boxShadow="0 0 10px shadow-color">
          <YStack flex={1} gap="2">
            <XStack pt="4" px="4" pb="3" justify="space-between" items="center">
              <XStack gap="3" items="center">
                <Logo />
              </XStack>
              <ThemeSwitch />
            </XStack>

            <Separator />

            <YStack flex={1} p="3" gap="2">
              <Link href="/home/settings" asChild>
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
              <XStack px="4" pb="4" pt="2" gap="3" items="center">
                <Avatar
                  size={40}
                  image={user.image}
                  name={user.name ?? user.username ?? 'User'}
                />
                <YStack flex={1}>
                  <H3 size="3" fontWeight="600">
                    {user.name || user.username}
                  </H3>
                </YStack>
              </XStack>
            )}
          </YStack>
        </Sheet.Container>
      </Sheet>
    </>
  )
})
