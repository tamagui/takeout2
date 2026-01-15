import { Slot } from 'one'
import { YStack } from 'tamagui'

import { MainHeader } from '~/features/app/MainHeader'
import { PageMainContainer } from '~/interface/layout/PageContainer'

export const SettingLayout = () => {
  return (
    <>
      <MainHeader />
      <YStack>
        <PageMainContainer pt="$10" $xl={{ maxW: 760 }}>
          <Slot />
        </PageMainContainer>
      </YStack>
    </>
  )
}
