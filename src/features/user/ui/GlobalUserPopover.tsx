import { useRef, useState } from 'react'
import { SizableText, XStack, YStack, type TamaguiElement } from 'tamagui'
import { isUserOnline } from '~/features/user/isUserOnline'
import { useAsyncEffect } from '@vxrn/helpers'
import { createEmitter, useEmitterValue } from '@vxrn/helpers'
import { Avatar } from '~/interface/avatars/Avatar'
import { Popover } from '~/interface/popover/Popover'
import type { UserWithState } from '~/data/types'
import { UserFriendButton } from './UserFriendButton'
import { animationClamped } from '~/interface/animations/animationClamped'
import { isEqualNever } from '@vxrn/helpers'

export const globalUserPopoverHover = createEmitter<UserWithState | null>(
  'global-user-popover',
  null,
  {
    comparator: isEqualNever,
  }
)

export const GlobalUserPopover = ({ children }: { children?: React.ReactNode }) => {
  const user = useEmitterValue(globalUserPopoverHover)
  const ref = useRef<TamaguiElement>(null)
  const [open, setOpen] = useState(false)

  useAsyncEffect(
    (signal) => {
      if (!open) return
      const node = ref.current
      if (!(node instanceof HTMLElement)) return

      document.addEventListener(
        'mousedown',
        (e) => {
          if (!(e.target instanceof HTMLElement)) return
          if (!node.contains(e.target)) {
            setOpen(false)
          }
        },
        {
          signal,
        }
      )
    },
    [open]
  )

  return (
    <Popover
      scope="user-popover"
      name="user-profile"
      offset={15}
      placement="left"
      onOpenChange={setOpen}
      stayInFrame={{ padding: 15 }}
      allowFlip
      resize
      hoverable={{
        delay: {
          open: 400,
          close: 0,
        },
      }}
    >
      {children}

      <Popover.Content
        animation={animationClamped('quick')}
        lazyMount
        p="$4"
        onPress={(e) => {
          e.stopPropagation()
        }}
      >
        {user && (
          <YStack ref={ref}>
            <XStack flexDirection="row-reverse" gap="$4">
              <Avatar isOnline={isUserOnline(user)} image={user.image} size={48} />
              <YStack minW={80} maxW={120} gap="$1">
                <SizableText ellipse size="$5" fontFamily="$mono">
                  {user.username || user.name}
                </SizableText>
                <XStack>
                  <UserFriendButton user={user} />
                </XStack>
              </YStack>
            </XStack>
          </YStack>
        )}
      </Popover.Content>
    </Popover>
  )
}
