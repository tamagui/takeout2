import { H2, H3, H5, Paragraph, Separator, styled, XStack, YStack } from 'tamagui'
import {
  ADMIN_EMAIL,
  APP_NAME,
  DISCORD_INVITE_URL,
  HELP_REQUESTS_URL,
  HELP_ROADMAP_URL,
} from '~/constants'
import { Link } from '~/interface/app/Link'
import { Icons } from '~/interface/icons'
import { InfoCard } from '~/interface/marketing/InfoCard'
import { MarketingPage } from '~/interface/marketing/MarketingPage'
import { SparkleIcon } from '~/interface/marketing/TakeoutIcons'

const SubHeading = styled(Paragraph, {
  fontFamily: 'takeout-body',
  size: '7',
  color: 'color-9',
})

export const sitemap = {
  priority: 0.7,
  changefreq: 'monthly',
}

export default function HelpPage() {
  return (
    <MarketingPage>
      <YStack maxW={850} self="center" gap={18}>
        <H2 fontFamily="takeout-heading">Help & Support</H2>

        <SubHeading>Got a question about {APP_NAME}? We're here to help.</SubHeading>

        <XStack flexWrap="wrap" columnGap={24} rowGap={2}>
          <Link href={`mailto:${ADMIN_EMAIL}`} target="_blank">
            <InfoCard title="Email Support" icon={<Icons.Mail size={26} />}>
              Send us an email at {ADMIN_EMAIL} and we'll get back to you as soon as
              possible.
            </InfoCard>
          </Link>

          <Link href={HELP_REQUESTS_URL} target="_blank">
            <InfoCard title="Submit a Request" icon={<Icons.Messages size={26} />}>
              Have a specific issue or question? Submit a support request and our team
              will help you out.
            </InfoCard>
          </Link>

          <Link href={HELP_ROADMAP_URL} target="_blank">
            <InfoCard title="Request a Feature" icon={<SparkleIcon size={26} />}>
              Have an idea for a new feature? Let us know what you'd like to see in{' '}
              {APP_NAME}.
            </InfoCard>
          </Link>

          <Link href={DISCORD_INVITE_URL} target="_blank">
            <InfoCard title="Join our Discord" icon={<Icons.Profile size={26} />}>
              Connect with our community and get real-time support from other users and
              our team.
            </InfoCard>
          </Link>
        </XStack>

        <YStack gap={24} mt={18}>
          <H3 fontFamily="takeout-heading">Frequently Asked Questions</H3>

          <Separator opacity={0.5} />

          <YStack gap={32} pr="lg:186px">
            <YStack gap={13}>
              <H5 fontFamily="takeout-heading">How do I reset my password?</H5>
              <Paragraph fontFamily="takeout-body">
                You can reset your password from the login screen by clicking "Forgot
                Password" and following the instructions sent to your email.
              </Paragraph>
            </YStack>

            <YStack gap={13}>
              <H5 fontFamily="takeout-heading">How do I delete my account?</H5>
              <Paragraph fontFamily="takeout-body">
                You can request account deletion from your profile settings. Please note
                that this action is permanent and cannot be undone.
              </Paragraph>
            </YStack>

            <YStack gap={13}>
              <H5 fontFamily="takeout-heading">How do I report inappropriate content?</H5>
              <Paragraph fontFamily="takeout-body">
                You can report content by contacting our support team directly.
              </Paragraph>
            </YStack>

            <YStack gap={13}>
              <H5 fontFamily="takeout-heading">Is my data secure?</H5>
              <Paragraph fontFamily="takeout-body">
                Yes, we take data security seriously and implement industry-standard
                measures to protect your information. See our Privacy Policy for more
                details.
              </Paragraph>
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </MarketingPage>
  )
}
