import type { TabsContentProps } from 'tamagui'

export type DialogConfirmType = {
  type: 'confirm'
  title: string
  description: string
  extraConfirm?: boolean
}

export type DialogOnboardType = {
  type: 'onboard'
}

// Simplified dialog types for social starter kit
export type DialogType = DialogConfirmType | DialogOnboardType

export type DialogProps = TabsContentProps
