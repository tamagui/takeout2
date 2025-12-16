import { Stack } from 'one'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { GlobalTooltipProvider } from '~/interface/tooltip/TooltipSimple'
import { TamaguiRootProvider } from '~/tamagui/TamaguiRootProvider'

export function MainLayout() {
  return (
    <TamaguiRootProvider>
      <GlobalTooltipProvider>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(app)" />
          </Stack>
        </SafeAreaProvider>
      </GlobalTooltipProvider>
    </TamaguiRootProvider>
  )
}
