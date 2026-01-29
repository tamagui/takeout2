import { Adapt, Sheet, YStack } from 'tamagui'

import { Popover } from '~/interface/popover/Popover'

import type { ReactNode } from 'react'
import type { PopoverName } from '~/interface/popover/Popover'

interface PopoverMenuProps {
  trigger: ReactNode
  children: ReactNode
  name?: PopoverName
  placement?: 'bottom-end' | 'bottom-start' | 'bottom' | 'top' | 'left' | 'right'
  shadow?: 'light' | 'medium' | 'strong'
  snapPoints?: number[]
}

export const PopoverMenu = ({
  trigger,
  children,
  name = 'menu',
  placement = 'bottom-end',
  shadow = 'light',
  snapPoints = [30],
}: PopoverMenuProps) => {
  return (
    <Popover name={name} size="$5" placement={placement}>
      <Popover.Trigger>{trigger}</Popover.Trigger>

      <Adapt when="max-md" platform="touch">
        <Sheet
          transition="quickLessBouncy"
          modal
          dismissOnSnapToBottom
          snapPoints={snapPoints}
          snapPointsMode="percent"
        >
          <Sheet.Overlay
            bg="$background"
            opacity={0.5}
            transition="quick"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Sheet.Handle />
          <Sheet.Frame p="$4">
            <Adapt.Contents />
          </Sheet.Frame>
        </Sheet>
      </Adapt>

      <Popover.Content shadow={shadow} p={0}>
        <YStack
          width="100%"
          // rounded="$5"
          overflow="hidden"
          height="100%"
          flex={1}
          flexBasis="auto"
        >
          {children}
        </YStack>
      </Popover.Content>
    </Popover>
  )
}
