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

  const handleChange = (val: string) => {
    setId(val)
    onValueChange?.(val)
  }

  return (
    <TamaguiSelect
      value={id}
      onValueChange={handleChange}
      disablePreventBodyScroll
      {...props}
    >
      <TamaguiSelect.Trigger
        iconAfter={CaretDownIcon}
        bg="transparent"
        borderColor="$color3"
        {...(width
          ? {
              width,
              maxWidth: typeof width === 'string' ? width : width || 220,
            }
          : {
              maxWidth: 220,
            })}
      >
        <XStack gap="$2" flex={1} items="center">
          {selected?.icon}
          <TamaguiSelect.Value placeholder={selected?.name || '-'} />
        </XStack>
      </TamaguiSelect.Trigger>

      <Adapt when="max-md" platform="touch">
        <Sheet
          native={!!props.native}
          modal
          dismissOnSnapToBottom
          transition="quickLessBouncy"
        >
          <Sheet.Frame>
            <Sheet.ScrollView>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay
            bg="$background"
            opacity={0.5}
            transition="quick"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Sheet>
      </Adapt>

      <TamaguiSelect.Content zIndex={3_500_000}>
        <TamaguiSelect.ScrollUpButton
          items="center"
          justify="center"
          position="relative"
          width="100%"
          height="$3"
        >
          <YStack z={10}>
            <CaretUpIcon size={20} />
          </YStack>
          <LinearGradient
            start={[0, 0]}
            end={[0, 1]}
            fullscreen
            colors={['$background', 'transparent']}
            rounded="$4"
          />
        </TamaguiSelect.ScrollUpButton>

        <TamaguiSelect.Viewport maxW={200}>
          {React.useMemo(
            () =>
              items.map((item, i) => {
                return (
                  <TamaguiSelect.Item index={i} key={item.id} value={item.id}>
                    <XStack flex={1} overflow="hidden" gap="$2" items="center">
                      {item.icon}
                      <TamaguiSelect.ItemText numberOfLines={1}>
                        {item.name}
                      </TamaguiSelect.ItemText>
                    </XStack>
                    <TamaguiSelect.ItemIndicator marginLeft="auto">
                      <CheckIcon size={12} color="$color9" />
                    </TamaguiSelect.ItemIndicator>
                  </TamaguiSelect.Item>
                )
              }),
            [items]
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
              width="$4"
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
          width="100%"
          height="$3"
        >
          <YStack z={10}>
            <CaretDownIcon size={20} />
          </YStack>
          <LinearGradient
            start={[0, 0]}
            end={[0, 1]}
            fullscreen
            colors={['transparent', '$background']}
            rounded="$4"
          />
        </TamaguiSelect.ScrollDownButton>
      </TamaguiSelect.Content>
    </TamaguiSelect>
  )
}
