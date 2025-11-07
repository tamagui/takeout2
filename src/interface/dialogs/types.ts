import type { TabsContentProps } from 'tamagui'

export type DialogClosedType = {
  type: 'closed'
}

export type DialogConfirmType = {
  type: 'confirm'
  title: string
  description: string
  extraConfirm?: boolean
}

export type DialogAdminPasswordType = {
  type: 'admin-password'
}

export type DialogErrorType = {
  type: 'error'
  title: string
  description: string
  dismissText?: string
}

export type DialogType =
  | DialogConfirmType
  | DialogClosedType
  | DialogAdminPasswordType
  | DialogErrorType

export type DialogLayer2 = DialogConfirmType | DialogClosedType | DialogErrorType

export type DialogProps = TabsContentProps
