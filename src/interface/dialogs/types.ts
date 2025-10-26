import type { TabsContentProps } from 'tamagui'

export type DialogConfirmType = {
  type: 'confirm'
  title: string
  description: string
  extraConfirm?: boolean
}

export type DialogClosedType = {
  type: 'closed'
}

export type DialogSignupType = {
  type: 'signup'
}

export type DialogDomainInstructions = {
  type: 'domain-instructions'
}

// Simplified dialog types for social starter kit
export type DialogType =
  | DialogConfirmType
  | DialogClosedType
  | DialogSignupType
  | DialogDomainInstructions

export type DialogLayer2 = DialogConfirmType | DialogClosedType

export type DialogProps = TabsContentProps

export type TabContentPaneProps = TabsContentProps

export type DialogCreateDataType = any // Placeholder for now
