import { Slot } from 'one'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { GlobalTooltipProvider } from '~/interface/tooltip/TooltipSimple'
import { TamaguiRootProvider } from '~/tamagui/TamaguiRootProvider'

export function MainLayout() {
  return (
    <TamaguiRootProvider>
      <GlobalTooltipProvider>
        <SafeAreaProvider>
          <Slot />
        </SafeAreaProvider>
      </GlobalTooltipProvider>
    </TamaguiRootProvider>
  )
}
