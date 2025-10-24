import type { TabsContentProps } from 'tamagui'
import type { Attachment } from '~/data/types'

export type DialogConfirmType = {
  type: 'confirm'
  title: string
  description: string
  extraConfirm?: boolean
}

export type DialogOnboardType = {
  type: 'onboard'
}

export type DialogInviteType = {
  type: 'invite'
  roleId?: string
}

export type DialogCreateApp = {
  type: 'create-app'
}

export type DialogCreateServerType = {
  type: 'create-server'
}

export type DialogJoinServerType = {
  type: 'join-server'
}

export type DialogAddFriend = {
  type: 'add-friend'
}

export type DialogSignup = {
  type: 'signup'
}

export type DialogRedirectToTauri = {
  type: 'redirect-to-tauri'
}

export type DialogCreateDataType = {
  type: 'create-data'
  attachments?: readonly Attachment[]
  text?: string
}

export type DialogDomainInstructions = {
  type: 'domain-instructions'
  domain: string
}

export type DialogClosedType = { type: 'closed' }

export type DialogLayer2 = DialogClosedType | DialogConfirmType

export type DialogType =
  | DialogClosedType
  | DialogInviteType
  | DialogCreateServerType
  | DialogJoinServerType
  | DialogAddFriend
  | DialogSignup
  | DialogRedirectToTauri
  | DialogOnboardType
  | DialogCreateApp
  | DialogCreateDataType
  | DialogDomainInstructions

export type TabContentPaneProps = TabsContentProps & {
  active: string
  value: string
  setShow: React.Dispatch<React.SetStateAction<boolean>>
}
