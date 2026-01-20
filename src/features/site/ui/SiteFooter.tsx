import { SizableText, XStack, YStack } from 'tamagui'

import { Link } from '~/interface/app/Link'
import { PageContainer } from '~/interface/layout/PageContainer'

export const SiteFooter = () => {
  return (
    <YStack py="$6" mt="auto">
      <PageContainer>
        <YStack mx="auto" width="100%" maxW={840} px="$4" gap="$4">
          <XStack gap="$4" flexWrap="wrap" justify="center">
            <Link href="/privacy-policy">
              <SizableText size="$3" color="$color11" hoverStyle={{ color: '$color12' }}>
                Privacy Policy
              </SizableText>
            </Link>
            <SizableText size="$3" color="$color8">
              •
            </SizableText>
            <Link href="/terms-of-service">
              <SizableText size="$3" color="$color11" hoverStyle={{ color: '$color12' }}>
                Terms of Service
              </SizableText>
            </Link>
            <SizableText size="$3" color="$color8">
              •
            </SizableText>
            <Link href="/help">
              <SizableText size="$3" color="$color11" hoverStyle={{ color: '$color12' }}>
                Help
              </SizableText>
            </Link>
          </XStack>
        </YStack>
      </PageContainer>
    </YStack>
  )
}
