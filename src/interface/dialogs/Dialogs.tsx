import { DialogAdminPassword } from './DialogAdminPassword'
import { DialogConfirm } from './DialogConfirm'
import { DialogCreatePost } from './DialogCreatePost'
import { DialogError } from './DialogError'
import { DialogOnboard } from './DialogOnboard'

export const Dialogs = () => {
  ;(globalThis as any).__sootDialogsCount = ((globalThis as any).__sootDialogsCount || 0) + 1
  if ((globalThis as any).__sootDialogsCount <= 80) {
    console.log('[soot-dialog] Dialogs render', {
      count: (globalThis as any).__sootDialogsCount,
    })
  }
  return (
    <>
      <DialogConfirm />
    </>
  )
}
