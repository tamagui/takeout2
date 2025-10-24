import { DialogAddFriend } from './DialogAddFriend'
import { DialogConfirm } from './DialogConfirm'
import { DialogCreateJoinServer } from './DialogCreateJoinServer'
import { DialogCreateApp } from './DialogCreateApp'
import { DialogCreateData } from './DialogCreateData'
import { DialogInvite } from './DialogInvite'

// Dialogs excluded from native:
// - DialogSignUp: Contains web-specific auth flow with <a> tags
// - DialogRedirectToTauri: Desktop-specific
// - DialogOnboard: Contains desktop-specific logic

export const Dialogs = () => {
  return (
    <>
      <DialogConfirm />
      <DialogCreateJoinServer />
      <DialogAddFriend />
      <DialogInvite />
      <DialogCreateApp />
      <DialogCreateData />
    </>
  )
}
