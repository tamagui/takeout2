import { useState } from 'react'
import { ScrollView, YStack, Text } from 'tamagui'
import { FEATURE_FLAGS } from '~/features/feature-flags'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { BasicHeader } from '~/interface/headers/BasicHeader'
import { PageHeading } from '~/interface/text/PageHeading'
import { usePostHog } from '~/features/feature-flags/usePostHog'

export function FeatureFlagsUI() {
  const posthog = usePostHog()
  const [showDetails, setShowDetails] = useState(false)

  return (
    <ScrollView>
      <YStack gap="$4" paddingHorizontal="$4" paddingVertical="$4">
        <BasicHeader title="Feature Flags" />
        <PageHeading title="Feature Flags" />

        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            Active Features
          </Text>
          {Object.entries(FEATURE_FLAGS).map(([key, flag]) => (
            <YStack
              key={key}
              paddingHorizontal="$2"
              paddingVertical="$2"
              backgroundColor="$background"
              borderRadius="$2"
            >
              <Text fontSize="$3" fontWeight="500">
                {key}
              </Text>
              <Text fontSize="$2" color="$color8">
                {flag}: {posthog.isFeatureEnabled(flag) ? '✅ Enabled' : '❌ Disabled'}
              </Text>
            </YStack>
          ))}
        </YStack>

        <ButtonSimple size="large" onPress={() => setShowDetails(!showDetails)}>
          <ButtonSimple.Text>
            {showDetails ? 'Hide' : 'Show'} Debug Info
          </ButtonSimple.Text>
        </ButtonSimple>

        {showDetails && (
          <YStack
            gap="$2"
            paddingHorizontal="$3"
            paddingVertical="$3"
            backgroundColor="$color2"
            borderRadius="$2"
          >
            <Text fontSize="$2" fontFamily="$mono">
              PostHog Debug Info
            </Text>
            <Text fontSize="$1" color="$color8">
              Feature flags are managed by PostHog. Check the PostHog dashboard for
              configuration.
            </Text>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  )
}
