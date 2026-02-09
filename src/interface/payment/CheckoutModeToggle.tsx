import { SizableText, View, XStack } from 'tamagui'

import type { CheckoutMode } from '~/features/payment/types'

const ToggleButton = ({
  active,
  onPress,
  children,
}: {
  active: boolean
  onPress: () => void
  children: string
}) => {
  return (
    <View
      px="$2.5"
      py="$1.5"
      bg={active ? '$color6' : 'transparent'}
      cursor="pointer"
      onPress={onPress}
      hoverStyle={{ bg: active ? '$color6' : '$color3' }}
      pressStyle={{ bg: active ? '$color7' : '$color4' }}
    >
      <SizableText
        size="$2"
        fontWeight={active ? '600' : '400'}
        color={active ? '$color12' : '$color10'}
      >
        {children}
      </SizableText>
    </View>
  )
}

export const CheckoutModeToggle = ({
  mode,
  onChange,
}: {
  mode: CheckoutMode
  onChange: (mode: CheckoutMode) => void
}) => {
  return (
    <XStack gap={0} borderWidth={1} borderColor="$color6" rounded="$3" overflow="hidden">
      <ToggleButton active={mode === 'hosted'} onPress={() => onChange('hosted')}>
        Hosted
      </ToggleButton>
      <ToggleButton active={mode === 'embedded'} onPress={() => onChange('embedded')}>
        Embedded
      </ToggleButton>
    </XStack>
  )
}
