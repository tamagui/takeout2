import { ScrollView, YStack, Text } from 'tamagui'
import { FEATURE_FLAGS } from '~/features/feature-flags'
import { BasicHeader } from '~/interface/headers/BasicHeader'
import { PageHeading } from '~/interface/text/PageHeading'
import { usePostHogClient } from '~/features/feature-flags/usePostHog'

export function FeatureFlagsUI() {
  const posthog = usePostHogClient()

  return (
    <ScrollView>
      <YStack gap="$4" px="$4" py="$4">
        <BasicHeader title="Feature Flags" />
        <PageHeading title="Feature Flags" />

        <Text fontSize="$3" color="$color9">
          Minimal feature flag configuration for demo app
        </Text>

        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            Active Features
          </Text>
          {Object.entries(FEATURE_FLAGS).map(([key, flag]) => (
            <YStack key={key} px="$2" py="$2" bg="$background" rounded="$2">
              <Text fontSize="$3" fontWeight="500">
                {key}
              </Text>
              <Text fontSize="$2" color="$color8">
                {flag}: {posthog.isFeatureEnabled(flag) ? '✅ Enabled' : '❌ Disabled'}
              </Text>
            </YStack>
          ))}
        </YStack>

        <YStack gap="$2" px="$3" py="$3" bg="$color2" rounded="$2">
          <Text fontSize="$2" fontFamily="$mono">
            PostHog Integration
          </Text>
          <Text fontSize="$1" color="$color8">
            Feature flags are managed via PostHog. Configure them in the PostHog
            dashboard.
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
