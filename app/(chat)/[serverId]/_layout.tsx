import { Slot } from 'one'
import { UserPresenceMutator } from '~/features/presence/UserPresenceMutator'

export default function ServerLayout() {
  return (
    <>
      <UserPresenceMutator />
      <Slot />
    </>
  )
}
