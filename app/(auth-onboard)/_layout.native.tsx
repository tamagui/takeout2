import { Stack } from 'one'
import { PlatformSpecificRootProvider } from '~/providers/PlatformSpecificRootProvider'

export function AuthAndOnboardingLayout() {
  return (
    <PlatformSpecificRootProvider>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
        {/* empty */}
      </Stack>
    </PlatformSpecificRootProvider>
  )
}
