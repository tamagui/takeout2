import { memo } from 'react'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
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
      <ButtonSimple
        size="small"
        {...props}
        circular={false}
        icon={added ? null : PlusIcon}
      >
        <ButtonSimple.Text size="small">{added ? removeText : addText}</ButtonSimple.Text>

        {added && (
          <YStack group="icon" containerType="normal" fullscreen>
            <HoverShowIcon>
              <XIcon size={18} />
            </HoverShowIcon>
            <HoverHideIcon>
              <CheckIcon size={18} />
            </HoverHideIcon>
          </YStack>
        )}
      </ButtonSimple>
    )
  }
)
