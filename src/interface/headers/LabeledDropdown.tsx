import type React from 'react'
import { XStack, YStack } from 'tamagui'
import { BodyText } from '~/interface/text/BodyText'
import { Select, type SelectProps } from '~/interface/select/Select'

interface LabeledDropdownProps extends Omit<SelectProps, 'children'> {
  label: string
  items: { name: string; id: string; icon?: React.ReactNode }[]
}

export const LabeledDropdown = ({
  label,
  items,
  ...selectProps
}: LabeledDropdownProps) => {
  return (
    <YStack gap="$2" width="100%">
      <BodyText size="$3" color="$color11">
        {label}
      </BodyText>
      <XStack>
        <Select items={items} {...selectProps} />
      </XStack>
    </YStack>
  )
}
