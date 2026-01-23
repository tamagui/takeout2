import { Slot } from 'one'
import { Spacer, View } from 'tamagui'

import { BottomTabBar } from '~/features/app/BottomTabBar'
import { MainHeader } from '~/features/app/MainHeader'

export function TabsLayout() {
  return (
    <>
      <MainHeader />
      <Spacer height={50} />
      <View flex={1} pb={60} $lg={{ pb: 0 }}>
        <Slot />
      </View>
      <BottomTabBar />
    </>
  )
}
