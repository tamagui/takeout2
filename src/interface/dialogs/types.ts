import type { TabsContentProps } from 'tamagui'

export type DialogConfirmType = {
  type: 'confirm'
  title: string
  description: string
  extraConfirm?: boolean
}

// Simplified dialog types for social starter kit
export type DialogType = DialogConfirmType

export type DialogProps = TabsContentProps
