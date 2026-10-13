import { useSafeAreaInsets } from 'one'
import { useMemo } from 'react'
import { Adapt, Sheet, Select as TamaguiSelect, XStack, YStack } from 'tamagui'
import { LinearGradient } from 'tamagui/linear-gradient'
import { LabeledField } from '../forms/LabeledField'
import { CaretDownIcon } from '../icons/phosphor/CaretDownIcon'
import { CaretUpIcon } from '../icons/phosphor/CaretUpIcon'
import { CheckIcon } from '../icons/phosphor/CheckIcon'
import { emptySelectionLabel, useSelectValue } from './useSelectValue'
import type { SelectProps } from './selectContract'

// a spacer that lifts sheet content above the home indicator. it mounts only
// inside the adapted touch sheet, where the app safe-area provider is present.
function SheetBottomInset() {
  const insets = useSafeAreaInsets()
  if (insets.bottom === 0) {
    return null
  }
  return <YStack height={insets.bottom} />
}

// a select that takes its options as data and owns their accessible presentation.
// uncontrolled unless `value` is passed.
export function Select({
  items,
  label,
  defaultValue,
  value,
  onValueChange,
  width,
  size = 'md',
  sheetBreakpoint = 'max-sm',
  testID,
  'aria-label': ariaLabel,
}: SelectProps) {
  const [id, setId] = useSelectValue({ items, value, defaultValue, onValueChange })
  const selected = items.find((item) => item.id === id)

  const options = useMemo(
    () =>
      items.map((item) => (
        <TamaguiSelect.Item
          key={item.id}
          value={item.id}
          // the web popover keeps compact rows instead of the touch menu's
          // 44pt targets.
          paddingVertical={0}
        >
          <XStack flex={1} overflow="hidden" gap={7} items="center">
            {item.icon}
            <TamaguiSelect.ItemText numberOfLines={1}>{item.name}</TamaguiSelect.ItemText>
          </XStack>
          <TamaguiSelect.ItemIndicator ml="auto">
            <CheckIcon size={12} color="placeholder-color" />
          </TamaguiSelect.ItemIndicator>
        </TamaguiSelect.Item>
      )),
    [items],
  )

  return (
    <LabeledField label={label}>
      <TamaguiSelect
        value={selected ? id : ''}
        onValueChange={setId}
        disablePreventBodyScroll
      >
        <TamaguiSelect.Trigger
          testID={testID}
          aria-label={ariaLabel ?? label}
          // the same surface as the form's Input, full width like it, so a
          // choice reads as one of the fields beside it.
          bg="background"
          size={size}
          borderWidth={0.5}
          borderColor="border-color"
          rounded="md"
          width={width ?? '100%'}
        >
          <XStack gap={7} flex={1} items="center">
            {selected?.icon}
            <TamaguiSelect.Value
              placeholder={selected?.name || emptySelectionLabel(label)}
            />
            <TamaguiSelect.Icon ml="auto">
              <CaretDownIcon size={14} color="color" />
            </TamaguiSelect.Icon>
          </XStack>
        </TamaguiSelect.Trigger>

        {sheetBreakpoint === false ? null : (
          <Adapt when={sheetBreakpoint} platform="touch">
            <Sheet modal dismissOnSnapToBottom snapPointsMode="fit" transition="medium">
              <Sheet.Container role="dialog" aria-modal aria-label={ariaLabel ?? label}>
                <Sheet.Background />
                <Sheet.ScrollView>
                  <Adapt.Contents />
                  <SheetBottomInset />
                </Sheet.ScrollView>
              </Sheet.Container>
              <Sheet.Overlay
                bg="shadow-color"
                transition="lazy"
                opacity="enter:0 exit:0"
              />
            </Sheet>
          </Adapt>
        )}

        <TamaguiSelect.Content>
          <TamaguiSelect.ScrollUpButton
            items="center"
            justify="center"
            position="relative"
            width="100%"
            height="9"
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
              colors={['background', 'transparent']}
            />
          </TamaguiSelect.ScrollUpButton>

          <TamaguiSelect.Viewport
            aria-label={ariaLabel ?? label}
            maxW={200}
            rounded="4"
            bg="background"
            borderWidth={0.5}
            borderColor="border-color"
            overflow="hidden"
            boxShadow="0 4px 12px shadow-color"
          >
            {options}
          </TamaguiSelect.Viewport>

          <TamaguiSelect.ScrollDownButton
            items="center"
            justify="center"
            position="relative"
            width="100%"
            height="9"
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
              colors={['transparent', 'background']}
            />
          </TamaguiSelect.ScrollDownButton>
        </TamaguiSelect.Content>
      </TamaguiSelect>
    </LabeledField>
  )
}
