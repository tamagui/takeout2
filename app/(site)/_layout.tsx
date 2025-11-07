import { Slot } from 'one'
import { ScrollView, YStack } from 'tamagui'
import { SiteFooter } from '~/features/site/components/SiteFooter'
import { SiteHeader } from '~/features/site/components/SiteHeader'
import { PageContainer } from '~/interface/layout/PageContainer'

export function SiteLayout() {
  return (
    <YStack flex={1} bg="$background">
      <SiteHeader />
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <PageContainer py="$6">
          <Slot />
        </PageContainer>
        <SiteFooter />
      </ScrollView>
    </YStack>
  )
}
