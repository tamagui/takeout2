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

export type DialogType = DialogConfirmType | DialogClosedType | DialogAdminPasswordType

export type DialogLayer2 = DialogConfirmType | DialogClosedType

export type DialogProps = TabsContentProps
