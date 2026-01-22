import { Slot } from 'one'
import { View, XStack, YStack } from 'tamagui'

import { MainHeader } from '~/features/app/MainHeader'
import { PageMainContainer } from '~/interface/layout/PageContainer'

import { SettingsSidebarContent } from './index'

export const SettingLayout = () => {
  return (
    <>
      <MainHeader />
      <XStack flex={1} flexBasis="auto" pt={50} minH="calc(100vh - 50px)">
        <View
          width={260}
          borderRightWidth={1}
          borderRightColor="$color4"
          bg="$background"
          position="sticky"
          t={50}
          height="calc(100vh - 50px)"
          shrink={0}
        >
          <SettingsSidebarContent />
        </View>
        <YStack flex={1} flexBasis="auto">
          <PageMainContainer pt="$6" $xl={{ maxW: 680 }}>
            <Slot />
          </PageMainContainer>
        </YStack>
      </XStack>
    </>
  )
}
