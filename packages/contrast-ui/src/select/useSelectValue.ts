import { useControllableState } from 'tamagui'
import type { SelectProps } from './selectContract'

export function emptySelectionLabel(label: string): string {
  return `Select ${label}`
}

// the chosen id, controlled when `value` is passed. every leg reads it here so
// they agree on the start: `defaultValue`, else the first item, read once at
// mount like any uncontrolled input. an id that matches no item means nothing
// is chosen yet.
export function useSelectValue({
  items,
  value,
  defaultValue,
  onValueChange,
}: Pick<SelectProps, 'items' | 'value' | 'defaultValue' | 'onValueChange'>) {
  return useControllableState({
    prop: value,
    defaultProp: defaultValue ?? items[0]?.id ?? '',
    onChange: onValueChange,
  })
}
