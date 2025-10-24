import { DialogAddFriend } from './DialogAddFriend'
import { DialogConfirm } from './DialogConfirm'
import { DialogCreateJoinServer } from './DialogCreateJoinServer'
import { DialogCreateApp } from './DialogCreateApp'
import { DialogInvite } from './DialogInvite'
import { DialogOnboard } from './DialogOnboard'
import { DialogRedirectToTauri } from './DialogRedirectToTauri'
import { DialogSignUp } from './DialogSignup'
import { DialogCreateData } from './DialogCreateData'
import { DialogDomainInstructionsComponent } from './DialogDomainInstructions'

export const Dialogs = () => {
  return (
    <>
      <DialogConfirm />
      <DialogCreateJoinServer />
      <DialogAddFriend />
      <DialogSignUp />
      <DialogRedirectToTauri />
      <DialogOnboard />
      <DialogInvite />
      <DialogCreateApp />
      <DialogCreateData />
      <DialogDomainInstructionsComponent />
    </>
  )
}
