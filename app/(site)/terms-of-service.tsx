import { SizableText, YStack } from 'tamagui'
import { ADMIN_EMAIL, APP_NAME } from '~/constants/app'
import { H1, H2 } from '~/interface/text/Headings'

export const TermsOfServicePage = () => {
  return (
    <YStack gap="$4" maxW={760}>
      <H1>Terms of Service</H1>
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
          <H2>Agreement to Terms</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            By accessing or using {APP_NAME}, you agree to be bound by these Terms of
            Service. If you disagree with any part of these terms, you may not access the
            service.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Use License</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            Permission is granted to temporarily use {APP_NAME} for personal,
            non-commercial use only. This is the grant of a license, not a transfer of
            title, and under this license you may not:
          </SizableText>
          <YStack gap="$2" pl="$4">
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Modify or copy the materials
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Use the materials for commercial purposes
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Attempt to decompile or reverse engineer the software
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Remove any copyright or proprietary notations
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Transfer the materials to another person
            </SizableText>
          </YStack>
        </YStack>

        <YStack gap="$2">
          <H2>User Accounts</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            When you create an account with us, you must provide accurate, complete, and
            current information. You are responsible for safeguarding your account and for
            all activities that occur under your account.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>User Content</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            You retain all rights to any content you submit, post, or display on or
            through the service. By submitting content, you grant us a worldwide,
            non-exclusive, royalty-free license to use, reproduce, modify, and distribute
            your content in connection with operating the service.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Prohibited Uses</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            You may not use {APP_NAME} to:
          </SizableText>
          <YStack gap="$2" pl="$4">
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Violate any laws or regulations
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Infringe upon the rights of others
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Distribute spam, malware, or harmful content
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Harass, abuse, or harm other users
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Attempt to gain unauthorized access to the service
            </SizableText>
            <SizableText size="$4" color="$color12" lineHeight="$4">
              • Impersonate any person or entity
            </SizableText>
          </YStack>
        </YStack>

        <YStack gap="$2">
          <H2>Intellectual Property</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            The service and its original content, features, and functionality are and will
            remain the exclusive property of {APP_NAME} and its licensors. Our trademarks
            and trade dress may not be used in connection with any product or service
            without our prior written consent.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Termination</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            We may terminate or suspend your account immediately, without prior notice or
            liability, for any reason, including breach of these terms. Upon termination,
            your right to use the service will immediately cease.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Limitation of Liability</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            In no event shall {APP_NAME}, nor its directors, employees, partners, agents,
            suppliers, or affiliates, be liable for any indirect, incidental, special,
            consequential, or punitive damages, including loss of profits, data, or other
            intangible losses.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Disclaimer</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            Your use of the service is at your sole risk. The service is provided on an
            "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either
            express or implied.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Governing Law</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            These terms shall be governed by and construed in accordance with the laws of
            your jurisdiction, without regard to its conflict of law provisions.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Changes to Terms</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            We reserve the right to modify or replace these terms at any time. If a
            revision is material, we will provide at least 30 days' notice prior to any
            new terms taking effect.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <H2>Contact Us</H2>
          <SizableText size="$4" color="$color12" lineHeight="$4">
            If you have any questions about these Terms of Service, please contact us at{' '}
            {ADMIN_EMAIL}.
          </SizableText>
        </YStack>
      </YStack>
    </YStack>
  )
}
