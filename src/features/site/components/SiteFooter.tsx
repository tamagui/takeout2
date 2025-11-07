import { router } from 'one'
import { SizableText, XStack, YStack } from 'tamagui'
import { APP_NAME, ADMIN_EMAIL } from '~/constants/app'
import { Pressable } from '~/interface/buttons/Pressable'

export const SiteFooter = () => {
  return (
    <YStack borderTopWidth={1} borderTopColor="$color3" bg="$color1" py="$6" mt="$8">
      <YStack mx="auto" width="100%" maxW={840} px="$4" gap="$4">
        <XStack gap="$4" flexWrap="wrap" justify="center">
          <Pressable onPress={() => router.push('/privacy-policy')}>
            <SizableText size="$3" color="$color11" hoverStyle={{ color: '$color12' }}>
              Privacy Policy
            </SizableText>
          </Pressable>
          <SizableText size="$3" color="$color8">
            •
          </SizableText>
          <Pressable onPress={() => router.push('/terms-of-service')}>
            <SizableText size="$3" color="$color11" hoverStyle={{ color: '$color12' }}>
              Terms of Service
            </SizableText>
          </Pressable>
          <SizableText size="$3" color="$color8">
            •
          </SizableText>
          <Pressable onPress={() => router.push('/help')}>
            <SizableText size="$3" color="$color11" hoverStyle={{ color: '$color12' }}>
              Help
            </SizableText>
          </Pressable>
        </XStack>
        <SizableText size="$2" color="$color10" text="center">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </SizableText>
        <SizableText size="$2" color="$color9" text="center">
          Contact: {ADMIN_EMAIL}
        </SizableText>
      </YStack>
    </YStack>
  )
}
