import React, { useState } from 'react'
import {
  Adapt,
  Sheet,
  Select as TamaguiSelect,
  XStack,
  YStack,
  getFontSize,
} from 'tamagui'
import { LinearGradient } from 'tamagui/linear-gradient'

import { CaretDownIcon } from '~/interface/icons/phosphor/CaretDownIcon'
import { CaretUpIcon } from '~/interface/icons/phosphor/CaretUpIcon'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'

import type {
  FontSizeTokens,
  SelectValueChangeDetails,
  SizeTokens,
  SelectProps as TamaguiSelectProps,
} from 'tamagui'

export type SelectProps = Omit<TamaguiSelectProps, 'children'> & {
  items: { name: string; id: string; icon?: React.ReactNode }[]
  width?: SizeTokens
}

export function Select({
  items,
  defaultValue,
  onValueChange,
  width,
  ...props
}: SelectProps) {
  const [id, setId] = useState(defaultValue || items[0]?.id)
  const selected = items.find((x) => x.id === id)

  const handleChange = (val: string, details: SelectValueChangeDetails) => {
    setId(val)
    onValueChange?.(val, details)
  }

  return (
    <TamaguiSelect
      value={id}
      onValueChange={handleChange}
      disablePreventBodyScroll
      {...props}
    >
      <TamaguiSelect.Trigger
        bg="transparent"
        borderColor="color3"
        {...(width
          ? {
              w: width,
              maxW: typeof width === 'string' ? width : width || 220,
            }
          : {
              maxW: 220,
            })}
      >
        <XStack gap="2" flex={1} items="center">
          {selected?.icon}
          <TamaguiSelect.Value placeholder={selected?.name || '-'} />
        </XStack>
        <CaretDownIcon size={16} />
      </TamaguiSelect.Trigger>

      <Adapt when="max-md" platform="touch">
        <Sheet
          native={!!props.native}
          modal
          dismissOnSnapToBottom
          transition="quickLessBouncy"
        >
          <Sheet.Container>
            <Sheet.ScrollView>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Container>
          <Sheet.Overlay
            bg="background"
            opacity="0.5 enter:0 exit:0"
            transition="quick"
          />
        </Sheet>
      </Adapt>

      <TamaguiSelect.Content>
        <TamaguiSelect.ScrollUpButton
          items="center"
          justify="center"
          position="relative"
          w="100%"
          h="3"
        >
          <YStack z={10}>
            <CaretUpIcon size={20} />
          </YStack>
          <LinearGradient
            start={[0, 0]}
            end={[0, 1]}
            rounded="4"
            position="absolute"
            inset={0}
            colors={['$background', 'transparent']}
          />
        </TamaguiSelect.ScrollUpButton>

        <TamaguiSelect.Viewport maxW={200}>
          {React.useMemo(
            () =>
              items.map((item) => {
                return (
                  <TamaguiSelect.Item key={item.id} value={item.id}>
                    <XStack flex={1} overflow="hidden" gap="2" items="center">
                      {item.icon}
                      <TamaguiSelect.ItemText numberOfLines={1}>
                        {item.name}
                      </TamaguiSelect.ItemText>
                    </XStack>
                    <TamaguiSelect.ItemIndicator ml="auto">
                      <CheckIcon size={12} color="$color9" />
                    </TamaguiSelect.ItemIndicator>
                  </TamaguiSelect.Item>
                )
              }),
            [items],
          )}

          {/* Native gets an extra icon */}
          {props.native && (
            <YStack
              position="absolute"
              r={0}
              t={0}
              b={0}
              items="center"
              justify="center"
              w="4"
              pointerEvents="none"
            >
              <CaretDownIcon
                size={getFontSize((props.size as FontSizeTokens) ?? '$true')}
              />
            </YStack>
          )}
        </TamaguiSelect.Viewport>

        <TamaguiSelect.ScrollDownButton
          items="center"
          justify="center"
          position="relative"
          w="100%"
          h="3"
        >
          <YStack z={10}>
            <CaretDownIcon size={20} />
          </YStack>
          <LinearGradient
            start={[0, 0]}
            end={[0, 1]}
            rounded="4"
            position="absolute"
            inset={0}
            colors={['transparent', '$background']}
          />
        </TamaguiSelect.ScrollDownButton>
      </TamaguiSelect.Content>
    </TamaguiSelect>
  )
}
