import type { ReactNode } from 'react'

// a screen's records as one grouped list. both legs take exactly these props:
// RecordList.ios.tsx draws iOS's inset-grouped list, RecordList.tsx draws the
// grouped card contrast-ui's Form Section draws on android and web.

export type RecordListProps = {
  /** the section header above the group. */
  title?: string
  children: ReactNode
  testID?: string
}

export type RecordRowProps = {
  title: string
  /** a second line under the title: the record's secondary detail. */
  subtitle?: string
  /** a leading glyph or thumbnail, at most 32 wide. */
  leading?: ReactNode
  /** a read-only trailing value on the title's line: an amount, a count, a streak. */
  value?: ReactNode
  /**
   * the record's one done state. the row then ends in the platform's check
   * control (iOS: a circle that fills; android and web: a checkbox) and
   * onCheckedChange toggles it. never a text button.
   */
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  /** opens the record. */
  onPress?: () => void
  testID?: string
}
