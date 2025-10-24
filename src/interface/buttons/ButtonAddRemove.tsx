import { memo } from 'react'
import { Check, Plus, X } from '@tamagui/lucide-icons'
import { ButtonSimple, type ButtonSimpleProps } from './ButtonSimple'
import { HoverHideIcon, HoverShowIcon } from './HoverIcon'
import { YStack } from 'tamagui'

export const ButtonAddRemove = memo(
  ({
    added,
    addText,
    removeText = '',
    ...props
  }: Omit<ButtonSimpleProps, 'children'> & {
    added: boolean
    addText: string
    removeText?: string
  }) => {
    return (
      <ButtonSimple size="small" {...props} circular={false} icon={added ? null : Plus}>
        <ButtonSimple.Text size="small">{added ? removeText : addText}</ButtonSimple.Text>

        {added && (
          <YStack group="icon" containerType="normal" fullscreen>
            <HoverShowIcon>
              <X size={18} />
            </HoverShowIcon>
            <HoverHideIcon>
              <Check size={18} />
            </HoverHideIcon>
          </YStack>
        )}
      </ButtonSimple>
    )
  }
)
