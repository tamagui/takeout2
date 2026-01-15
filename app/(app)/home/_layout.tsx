import { Slot } from 'one'
import { Spacer } from 'tamagui'

import { MainHeader } from '~/features/main/MainHeader'

export function TabsLayout() {
  return (
    <>
      <MainHeader />
      <Spacer height={50} />
      <Slot />
    </>
  )
}
