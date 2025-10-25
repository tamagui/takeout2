import { ScrollView, YStack } from 'tamagui'
import { BasicHeader } from '~/interface/headers/BasicHeader'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { BodyText } from '~/interface/text/Body'
import { H3, H5 } from '~/interface/text/Headings'

export const EULAPage = () => {
  return (
    <YStack flex={1} bg="$background">
      <BasicHeader title="EULA" BackIcon={CaretLeftIcon} />

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack px="$5" py="$4" gap="$4">
          <H3 text="center">End User License Agreement (EULA)</H3>

          <BodyText color="$color11" lineHeight={24}>
            Welcome to Fleek! Before using the app, please review this agreement. By
            continuing to use Fleek, you agree to comply with the following terms:
          </BodyText>

          <YStack gap="$3">
            <YStack gap="$2">
              <H5 color="$color12">1. User-Generated Content</H5>
              <BodyText color="$color11">
                All content you create or share must follow Fleek's rules.
              </BodyText>
              <BodyText color="$color11">
                Objectionable, abusive, or illegal content is strictly prohibited.
              </BodyText>
            </YStack>

            <YStack gap="$2">
              <H5 color="$color12">2. Content Moderation</H5>
              <BodyText color="$color11">
                We use AI-powered moderation to prevent objectionable content.
              </BodyText>
              <BodyText color="$color11">
                Users can report inappropriate content via the in-app reporting feature.
              </BodyText>
              <BodyText color="$color11">
                Users can block other users to prevent seeing their content.
              </BodyText>
              <BodyText color="$color11">
                Reported content will be reviewed and addressed within 24 hours.
              </BodyText>
              <BodyText color="$color11">
                We have zero tolerance for objectionable or abusive behavior.
              </BodyText>
            </YStack>

            <YStack gap="$2">
              <H5 color="$color12">3. Account Suspension & Removal</H5>
              <BodyText color="$color11">
                Fleek reserves the right to remove content, suspend accounts, or take
                other action for violations at any time.
              </BodyText>
            </YStack>

            <YStack gap="$2">
              <H5 color="$color12">4. Acceptance</H5>
              <BodyText color="$color11">
                By using Fleek, you agree to this EULA and our Terms of Service and
                Privacy Policy.
              </BodyText>
            </YStack>
          </YStack>

          {/* Add bottom padding for better scrolling experience */}
          <YStack height={40} />
        </YStack>
      </ScrollView>
    </YStack>
  )
}
