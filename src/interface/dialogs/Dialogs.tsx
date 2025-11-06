import { DialogAdminPassword } from './DialogAdminPassword'
import { DialogConfirm } from './DialogConfirm'
import { DialogOnboard } from './DialogOnboard'

export const Dialogs = () => {
  return (
    <>
      <DialogConfirm />
      <DialogOnboard />
      <DialogAdminPassword />
    </>
  )
}
