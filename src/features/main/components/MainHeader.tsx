import { Link } from 'one'
import { useEffect, useState } from 'react'
import { Popover, XStack, YStack, isClient, isWeb } from 'tamagui'
import { useUser } from '~/features/user/useUser'
import { Logo } from '~/interface/app/Logo'
import { Avatar } from '~/interface/avatars/Avatar'
import { Pressable } from '~/interface/buttons/Pressable'
import Glint from '~/interface/effects/Glint'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'
import { UserProfileEditPopover } from '../../user/ui/UserProfileEditPopover'
import { NavigationTabs } from './NavigationTabs'

export const MainHeader = () => {
  const { user } = useUser()
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll detection
  useEffect(() => {
    if (!isClient) return

    const onScroll = () => {
      setIsScrolled(window.scrollY > 30)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (!isWeb) return null

  return (
    <XStack
      // @ts-expect-error
      position="fixed"
      t={0}
      l={0}
      r={0}
      items="center"
      justify="center"
      z={50}
      $gtSm={{
        px: '$1',
      }}
    >
      <XStack width="100%" maxW={1200} position="relative">
        <XStack
          py="$2.5"
          px="$4"
          width="100%"
          overflow="hidden"
          rounded={isScrolled ? '$10' : 0}
          animation="quick"
          y={isScrolled ? 6 : 0}
          contain="paint"
        >
          {isScrolled && <Glint rounded="$10" />}

          <YStack
            position="absolute"
            inset={0}
            animation="quick"
            style={{
              ...(isScrolled && {
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }),
            }}
          />

          <YStack
            opacity={isScrolled ? 0.85 : 0}
            animation="quick"
            position="absolute"
            inset={0}
            bg="$color2"
            rounded={isScrolled ? '$6' : 0}
          />

          <XStack items="center" justify="space-between" width="100%" z={1}>
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
              <ThemeSwitch size="$2" />
            </XStack>
          </XStack>
        </XStack>
      </XStack>
    </XStack>
  )
}
