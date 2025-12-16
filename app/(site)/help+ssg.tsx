import { Paragraph, Separator, XStack, YStack } from 'tamagui'

import {
  ADMIN_EMAIL,
  APP_NAME,
  DISCORD_INVITE_URL,
  HELP_REQUESTS_URL,
  HELP_ROADMAP_URL,
} from '~/constants/app'
import { InfoCard } from '~/features/site/ui/InfoCard'
import { HeadInfo } from '~/interface/app/HeadInfo'
import { Link } from '~/interface/app/Link'
import { ChatCircleIcon } from '~/interface/icons/phosphor/ChatCircleIcon'
import { EnvelopeIcon } from '~/interface/icons/phosphor/EnvelopeIcon'
import { SparkleIcon } from '~/interface/icons/phosphor/SparkleIcon'
import { UserIcon } from '~/interface/icons/phosphor/UserIcon'
import { H2, H3, H5, SubHeading } from '~/interface/text/Headings'

export const sitemap = {
  priority: 0.7,
  changefreq: 'monthly',
}

export const HelpPage = () => {
  return (
    <YStack maxW={850} self="center" gap="$4">
      <HeadInfo
        title="Help & Support"
        description="Get help with Takeout. Contact support, submit requests, or browse frequently asked questions."
      />
      <H2>Help & Support</H2>

      <SubHeading>Got a question about {APP_NAME}? We're here to help.</SubHeading>

      <XStack flexWrap="wrap" columnGap="$5" rowGap="$1">
        <Link asChild hideExternalIcon href={`mailto:${ADMIN_EMAIL}`} target="_blank">
          <InfoCard maxColumns={2} title="Email Support" Icon={EnvelopeIcon}>
            Send us an email at {ADMIN_EMAIL} and we'll get back to you as soon as
            possible.
          </InfoCard>
        </Link>

        <Link asChild hideExternalIcon href={HELP_REQUESTS_URL} target="_blank">
          <InfoCard maxColumns={2} title="Submit a Request" Icon={ChatCircleIcon}>
            Have a specific issue or question? Submit a support request and our team will
            help you out.
          </InfoCard>
        </Link>

        <Link asChild hideExternalIcon href={HELP_ROADMAP_URL} target="_blank">
          <InfoCard maxColumns={2} title="Request a Feature" Icon={SparkleIcon}>
            Have an idea for a new feature? Let us know what you'd like to see in{' '}
            {APP_NAME}.
          </InfoCard>
        </Link>

        <Link asChild hideExternalIcon href={DISCORD_INVITE_URL} target="_blank">
          <InfoCard maxColumns={2} title="Join our Discord" Icon={UserIcon}>
            Connect with our community and get real-time support from other users and our
            team.
          </InfoCard>
        </Link>
      </XStack>

      <YStack gap="$5" mt="$4">
        <H3>Frequently Asked Questions</H3>

        <Separator opacity={0.5} />

        <YStack
          gap="$6"
          $lg={{
            pr: '$20',
          }}
        >
          <YStack gap="$3">
            <H5>How do I reset my password?</H5>
            <Paragraph>
              You can reset your password from the login screen by clicking "Forgot
              Password" and following the instructions sent to your email.
            </Paragraph>
          </YStack>

          <YStack gap="$3">
            <H5>How do I delete my account?</H5>
            <Paragraph>
              You can request account deletion from your profile settings. Please note
              that this action is permanent and cannot be undone.
            </Paragraph>
          </YStack>

          <YStack gap="$3">
            <H5>How do I report inappropriate content?</H5>
            <Paragraph>
              You can report content by using the menu on any post or by contacting our
              support team directly.
            </Paragraph>
          </YStack>

          <YStack gap="$3">
            <H5>Is my data secure?</H5>
            <Paragraph>
              Yes, we take data security seriously and implement industry-standard
              measures to protect your information. See our Privacy Policy for more
              details.
            </Paragraph>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  )
}
