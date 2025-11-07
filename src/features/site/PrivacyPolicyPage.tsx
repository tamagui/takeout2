import { SizableText, YStack } from 'tamagui'
import { APP_NAME, ADMIN_EMAIL, DOMAIN } from '~/constants/app'
import { H1, H2, H3 } from '~/interface/text/Headings'

export const PrivacyPolicyPage = () => {
  return (
    <YStack gap="$4" maxW={760}>
      <H1>Privacy Policy</H1>
      <SizableText size="$3" color="$color11">
        Last updated:{' '}
        {new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </SizableText>

      <YStack gap="$4" mt="$4">
        <YStack gap="$2">
          <H2>Introduction</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            Welcome to {APP_NAME}. We respect your privacy and are committed to protecting
            your personal data. This privacy policy will inform you about how we handle
            your personal data when you use our service.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Information We Collect</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            We collect information that you provide directly to us, including:
          </SizableText>
          <YStack gap="$2" pl="$4">
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Account information (email, username, profile details)
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Content you create, upload, or share through our service
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Communications with us
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Usage data and analytics
            </SizableText>
          </YStack>
        </YStack>

        <YStack gap="$2">
          <H2>How We Use Your Information</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            We use the information we collect to:
          </SizableText>
          <YStack gap="$2" pl="$4">
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Provide, maintain, and improve our services
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Process your transactions and send related information
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Send you technical notices and support messages
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Respond to your comments and questions
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Monitor and analyze trends, usage, and activities
            </SizableText>
          </YStack>
        </YStack>

        <YStack gap="$2">
          <H2>Data Security</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            We implement appropriate technical and organizational measures to protect your
            personal data against unauthorized or unlawful processing, accidental loss,
            destruction, or damage.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Data Retention</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            We retain your personal information for as long as necessary to fulfill the
            purposes outlined in this privacy policy, unless a longer retention period is
            required by law.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Your Rights</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            You have the right to:
          </SizableText>
          <YStack gap="$2" pl="$4">
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Access your personal data
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Correct inaccurate data
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Request deletion of your data
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Object to processing of your data
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Request data portability
            </SizableText>
          </YStack>
        </YStack>

        <YStack gap="$2">
          <H2>Cookies and Tracking</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            We use cookies and similar tracking technologies to track activity on our
            service and hold certain information. You can instruct your browser to refuse
            all cookies or to indicate when a cookie is being sent.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Third-Party Services</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            We may employ third-party companies and individuals to facilitate our service,
            provide the service on our behalf, perform service-related services, or assist
            us in analyzing how our service is used. These third parties have access to
            your personal data only to perform these tasks on our behalf.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Children's Privacy</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            Our service is not directed to children under 13. We do not knowingly collect
            personal information from children under 13. If you are a parent or guardian
            and you are aware that your child has provided us with personal data, please
            contact us.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Changes to This Policy</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            We may update our privacy policy from time to time. We will notify you of any
            changes by posting the new privacy policy on this page and updating the "Last
            updated" date.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Contact Us</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            If you have any questions about this privacy policy, please contact us at{' '}
            {ADMIN_EMAIL}.
          </SizableText>
        </YStack>
      </YStack>
    </YStack>
  )
}
