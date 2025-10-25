import { Slot } from 'one'
import { Dialogs } from '~/interface/dialogs/Dialogs'

export default function AppLayout() {
  return (
    <>
      <Dialogs />
      <Slot />
    </>
  )
}
