import { Link, router } from 'one'
import { memo, useState } from 'react'
import { H3, Separator, Sheet, Spacer, View, XStack, YStack } from 'tamagui'

import { useLogout } from '~/features/auth/useLogout'
import { useUser } from '~/features/user/useUser'
import { Logo } from '~/interface/app/Logo'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
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
  return (
    <ScrollHeader>
      <PageContainer>
        <YStack width="100%" py="$2.5">
          <XStack position="relative" width="100%" px="$2" items="center">
            <XStack gap="$2" items="center">
              <Link href="/" aria-label="Home">
                <Logo height={20} />
              </Link>
            </XStack>

            <Spacer flex={1} />

            <XStack
              position="absolute"
              inset={0}
              pointerEvents="none"
              items="center"
              justify="center"
            >
              <View pointerEvents="auto">
                <NavigationTabs />
              </View>
            </XStack>

            <XStack gap="$2.5" items="center" display="none" $md={{ display: 'flex' }}>
              {user && (
                <UserProfilePopover
                  trigger={
                    <ButtonSimple size="medium" circular cursor="pointer">
                      <Avatar
                        size={28}
                        image={user.image}
                        name={user.name ?? user.username ?? 'User'}
                      />
                    </ButtonSimple>
                  }
                />
              )}

              <ThemeSwitch />
              <ButtonSimple
                size="medium"
                circular
                onPress={() => router.push('/home/settings')}
                icon={<GearIcon size={18} />}
                aria-label="Settings"
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
      <ButtonSimple
        size="large"
        variant="transparent"
        circular
        icon={<ListIcon size="$1" />}
        aria-label="Menu"
        onPress={() => setOpen(true)}
        $md={{ display: 'none' }}
      />
      <Sheet
        open={open}
        onOpenChange={setOpen}
        transition="medium"
        modal
        dismissOnSnapToBottom
        snapPoints={[50]}
      >
        <Sheet.Overlay
          bg="$background"
          opacity={0.5}
          transition="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Frame bg="$color2" boxShadow="0 0 10px $shadow4">
          <YStack flex={1} gap="$2">
            <XStack p="$4" pb="$3" justify="space-between" items="center">
              <XStack gap="$3" items="center">
                <Logo height={32} />
              </XStack>
              <ThemeSwitch />
            </XStack>

            <Separator />

            <YStack flex={1} p="$3" gap="$2">
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
              <XStack p="$4" pt="$2" gap="$3" items="center">
                <Avatar
                  size={40}
                  image={user.image}
                  name={user.name ?? user.username ?? 'User'}
                />
                <YStack flex={1}>
                  <H3 size="$3" fontWeight="600">
                    {user.name || user.username}
                  </H3>
                </YStack>
              </XStack>
            )}
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  )
})
