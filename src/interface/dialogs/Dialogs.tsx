import { DialogAdminPassword } from './DialogAdminPassword'
import { DialogConfirm } from './DialogConfirm'
import { DialogError } from './DialogError'
import { DialogOnboard } from './DialogOnboard'

export const Dialogs = () => {
  return (
    <>
      <DialogConfirm />
      <DialogError />
      <DialogOnboard />
      <DialogAdminPassword />
    </>
  )
}
