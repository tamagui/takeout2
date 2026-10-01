import { SizableText, XStack, YStack } from 'tamagui'
import { Link } from '~/interface/app/Link'

export const SiteFooter = () => {
  return (
    <YStack py={32} mt="auto" width="100%" borderTopWidth={1} borderColor="color-3">
      <YStack mx="auto" width="100%" maxW={840} px={16} gap={16}>
        <XStack gap={16} flexWrap="wrap" justify="center" items="center">
          <Link href="https://takeout.tamagui.dev/privacy-policy">
            <SizableText fontFamily="takeout-body" size="3" color="color-9 hover:color-11">
              Privacy Policy
            </SizableText>
          </Link>
          <SizableText fontFamily="takeout-body" size="3" color="color-6">
            •
          </SizableText>
          <Link href="https://takeout.tamagui.dev/terms-of-service">
            <SizableText fontFamily="takeout-body" size="3" color="color-9 hover:color-11">
              Terms of Service
            </SizableText>
          </Link>
          <SizableText fontFamily="takeout-body" size="3" color="color-6">
            •
          </SizableText>
          <Link href="https://takeout.tamagui.dev/help">
            <SizableText fontFamily="takeout-body" size="3" color="color-9 hover:color-11">
              Help
            </SizableText>
          </Link>
        </XStack>
      </YStack>
    </YStack>
  )
}
