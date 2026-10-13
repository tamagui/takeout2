import type { DialogSheetBreakpoint } from '../dialog/DialogHost'
import type { ComponentProps, ReactNode } from 'react'
import type { Select as TamaguiSelect, SelectSize } from 'tamagui'

// the props every Select leg implements. structural types live once, in the
// owning contract, so no leg can drift from the others silently.
//
// the label is required and visible on every leg: the web caption above the
// trigger, the ios form row, the android field label. a choice without one is
// the pill this contract replaces. legs ignore the props only another leg can
// express (size, width, the sheet breakpoint) rather than each taking a
// narrower type, so a call site compiles on every platform.
export type SelectItem = {
  id: string
  name: string
  icon?: ReactNode
}

export type SelectProps = {
  items: SelectItem[]
  label: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  size?: Exclude<SelectSize, boolean>
  width?: ComponentProps<typeof TamaguiSelect.Trigger>['width']
  'aria-label'?: string
  // below this width the options adapt into a sheet, which is the only usable
  // presentation on a phone. `false` keeps the popover at every width. the
  // web leg only; the native legs never sheet.
  sheetBreakpoint?: DialogSheetBreakpoint
  testID?: string
}
