import { Link } from 'one'
import { useEffect, useState } from 'react'
import { XStack, YStack, isClient, isWeb } from 'tamagui'
import { useUser } from '~/features/user/useUser'
import { Logo } from '~/interface/app/Logo'
import { Avatar } from '~/interface/avatars/Avatar'
import { Pressable } from '~/interface/buttons/Pressable'
import { PageContainer } from '~/interface/layout/PageContainer'
import { ScrollHeader } from '~/interface/headers/ScrollHeader'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'
import { UserProfilePopover } from '../../user/ui/UserProfilePopover'
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
                <UserProfilePopover
                  trigger={
                    <Pressable cursor="pointer" items="center" justify="center">
                      <Avatar size={32} image={user.image} />
                    </Pressable>
                  }
                />
              )}
              <ThemeSwitch size="$2" />
            </XStack>
          </XStack>
        </YStack>
      </PageContainer>
    </ScrollHeader>
  )
}
