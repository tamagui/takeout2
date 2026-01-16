import { APP_NAME } from '~/constants/app'
import {
  LegalList,
  LegalPage,
  LegalSection,
  LegalText,
} from '~/features/site/ui/LegalPage'
import { HeadInfo } from '~/interface/app/HeadInfo'

export function EULAPage() {
  return (
    <LegalPage title="End User License Agreement (EULA)">
      <HeadInfo
        title="End User License Agreement"
        description="Review the End User License Agreement (EULA) for Takeout."
      />
      <LegalText>
        Welcome to {APP_NAME}! Before using the app, please review this agreement. By
        continuing to use {APP_NAME}, you agree to comply with the following terms:
      </LegalText>

      <LegalSection title="1. User-Generated Content">
        <LegalText>
          All content you create or share must follow {APP_NAME}'s rules.
        </LegalText>
        <LegalText>
          Objectionable, abusive, or illegal content is strictly prohibited.
        </LegalText>
      </LegalSection>

      <LegalSection title="2. Content Moderation">
        <LegalList>
          <LegalText>
            • We use AI-powered moderation to prevent objectionable content.
          </LegalText>
          <LegalText>
            • Users can report inappropriate content via the in-app reporting feature.
          </LegalText>
          <LegalText>
            • Users can block other users to prevent seeing their content.
          </LegalText>
          <LegalText>
            • Reported content will be reviewed and addressed within 24 hours.
          </LegalText>
          <LegalText>
            • We have zero tolerance for objectionable or abusive behavior.
          </LegalText>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Account Suspension & Removal">
        <LegalText>
          {APP_NAME} reserves the right to remove content, suspend accounts, or take other
          action for violations at any time.
        </LegalText>
      </LegalSection>

      <LegalSection title="4. Acceptance">
        <LegalText>
          By using {APP_NAME}, you agree to this EULA and our Terms of Service and Privacy
          Policy.
        </LegalText>
      </LegalSection>
    </LegalPage>
  )
}
