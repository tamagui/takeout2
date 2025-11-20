import { Linking } from 'react-native'
import { SizableText, YStack } from 'tamagui'
import {
  APP_NAME,
  ADMIN_EMAIL,
  HELP_REQUESTS_URL,
  HELP_ROADMAP_URL,
  DISCORD_INVITE_URL,
} from '~/constants/app'
import { Pressable } from '~/interface/buttons/Pressable'
import { ChatCircleIcon } from '~/interface/icons/phosphor/ChatCircleIcon'
import { UserIcon } from '~/interface/icons/phosphor/UserIcon'
import { EnvelopeIcon } from '~/interface/icons/phosphor/EnvelopeIcon'
import { SparkleIcon } from '~/interface/icons/phosphor/SparkleIcon'
import { H1, H2 } from '~/interface/text/Headings'

export const HelpPage = () => {
  const openUrl = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open URL:', err)
    })
  }

  return (
    <YStack gap="$4" maxW={760}>
      <H1>Help & Support</H1>
      <SizableText size="$4" color="$color11" lineHeight="$4">
        Need help with {APP_NAME}? We're here to assist you.
      </SizableText>

      <YStack gap="$4" mt="$4">
        <YStack gap="$3">
          <H2>Get in Touch</H2>

          <Pressable onPress={() => openUrl(`mailto:${ADMIN_EMAIL}`)}>
            <YStack
              bg="$color2"
              p="$4"
              rounded="$4"
              borderWidth={1}
              borderColor="$color4"
              gap="$2"
              hoverStyle={{
                bg: '$color3',
                borderColor: '$color6',
              }}
            >
              <YStack gap="$2">
                <EnvelopeIcon size={24} color="$color11" />
                <SizableText size="$5" fontWeight="600" color="$color12">
                  Email Support
                </SizableText>
                <SizableText size="$3" color="$color11" lineHeight="$3">
                  Send us an email at {ADMIN_EMAIL} and we'll get back to you as soon as
                  possible.
                </SizableText>
              </YStack>
            </YStack>
          </Pressable>

          <Pressable onPress={() => openUrl(HELP_REQUESTS_URL)}>
            <YStack
              bg="$color2"
              p="$4"
              rounded="$4"
              borderWidth={1}
              borderColor="$color4"
              gap="$2"
              hoverStyle={{
                bg: '$color3',
                borderColor: '$color6',
              }}
            >
              <YStack gap="$2">
                <ChatCircleIcon size={24} color="$color11" />
                <SizableText size="$5" fontWeight="600" color="$color12">
                  Submit a Request
                </SizableText>
                <SizableText size="$3" color="$color11" lineHeight="$3">
                  Have a specific issue or question? Submit a support request and our team
                  will help you out.
                </SizableText>
              </YStack>
            </YStack>
          </Pressable>

          <Pressable onPress={() => openUrl(HELP_ROADMAP_URL)}>
            <YStack
              bg="$color2"
              p="$4"
              rounded="$4"
              borderWidth={1}
              borderColor="$color4"
              gap="$2"
              hoverStyle={{
                bg: '$color3',
                borderColor: '$color6',
              }}
            >
              <YStack gap="$2">
                <SparkleIcon size={24} color="$color11" />
                <SizableText size="$5" fontWeight="600" color="$color12">
                  Request a Feature
                </SizableText>
                <SizableText size="$3" color="$color11" lineHeight="$3">
                  Have an idea for a new feature? Let us know what you'd like to see in{' '}
                  {APP_NAME}.
                </SizableText>
              </YStack>
            </YStack>
          </Pressable>

          <Pressable onPress={() => openUrl(DISCORD_INVITE_URL)}>
            <YStack
              bg="$color2"
              p="$4"
              rounded="$4"
              borderWidth={1}
              borderColor="$color4"
              gap="$2"
              hoverStyle={{
                bg: '$color3',
                borderColor: '$color6',
              }}
            >
              <YStack gap="$2">
                <UserIcon size={24} color="$color11" />
                <SizableText size="$5" fontWeight="600" color="$color12">
                  Join our Discord
                </SizableText>
                <SizableText size="$3" color="$color11" lineHeight="$3">
                  Connect with our community and get real-time support from other users
                  and our team.
                </SizableText>
              </YStack>
            </YStack>
          </Pressable>
        </YStack>

        <YStack gap="$2" mt="$4">
          <H2>Frequently Asked Questions</H2>

          <YStack gap="$3">
            <YStack gap="$1">
              <SizableText size="$4" fontWeight="600" color="$color12">
                How do I reset my password?
              </SizableText>
              <SizableText size="$3" color="$color11" lineHeight="$3">
                You can reset your password from the login screen by clicking "Forgot
                Password" and following the instructions sent to your email.
              </SizableText>
            </YStack>

            <YStack gap="$1">
              <SizableText size="$4" fontWeight="600" color="$color12">
                How do I delete my account?
              </SizableText>
              <SizableText size="$3" color="$color11" lineHeight="$3">
                You can request account deletion from your profile settings. Please note
                that this action is permanent and cannot be undone.
              </SizableText>
            </YStack>

            <YStack gap="$1">
              <SizableText size="$4" fontWeight="600" color="$color12">
                How do I report inappropriate content?
              </SizableText>
              <SizableText size="$3" color="$color11" lineHeight="$3">
                You can report content by using the menu on any post or by contacting our
                support team directly.
              </SizableText>
            </YStack>

            <YStack gap="$1">
              <SizableText size="$4" fontWeight="600" color="$color12">
                Is my data secure?
              </SizableText>
              <SizableText size="$3" color="$color11" lineHeight="$3">
                Yes, we take data security seriously and implement industry-standard
                measures to protect your information. See our Privacy Policy for more
                details.
              </SizableText>
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  )
}
