import { router } from 'one'
import type { ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Spacer, Theme, XStack, YStack } from 'tamagui'
import { Pressable } from '~/interface/buttons/Pressable'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { H5 } from '~/interface/text/Headings'
import type { IconComponent } from '../icons/types'
import { ForwardButton } from './ForwardButton'

interface BasicHeaderProps {
  title?: string
  onClose?: () => void
  BackIcon?: IconComponent
  forwardAction?: string | ReactNode
  onForwardAction?: () => void
  forwardActionDisabled?: boolean
}

export const BasicHeader = ({
  title,
  onClose,
  BackIcon,
  forwardAction,
  onForwardAction,
  forwardActionDisabled,
}: BasicHeaderProps) => {
  const { top } = useSafeAreaInsets()

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      router.back()
    }
  }

  return (
    <XStack
      items="center"
      justify="space-between"
      pt={top + 8}
      px="$3"
      pb="$2"
      bg="$background"
      z={1000}
    >
      <XStack height={36} items="center" justify="space-between" flex={1}>
        <Pressable onPress={handleClose}>
          {BackIcon ? (
            <BackIcon size={24} color="$color11" />
          ) : (
            <XIcon size={24} color="$color11" />
          )}
        </Pressable>

        <YStack
          position="absolute"
          pointerEvents="none"
          fullscreen
          items="center"
          justify="center"
        >
          <H5 color="$color12">{title}</H5>
        </YStack>

        {forwardAction ? (
          typeof forwardAction === 'string' ? (
            <Theme name="purple">
              <ForwardButton
                title={forwardAction}
                onPress={onForwardAction}
                disabled={forwardActionDisabled}
              />
            </Theme>
          ) : (
            forwardAction
          )
        ) : (
          <Spacer width={24} />
        )}
      </XStack>
    </XStack>
  )
}
