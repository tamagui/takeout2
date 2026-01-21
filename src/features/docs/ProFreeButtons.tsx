import { Theme, View, XGroup, XStack, SizableText } from 'tamagui'

import { Link } from '~/interface/app/Link'

export const ProFreeButtons = () => {
  return (
    <Theme name="black">
      {/* wrap in View for responsive display - XGroup loses media query classes in SSR */}
      <View display="none" $md={{ display: 'flex' }} ml="$3">
        <XGroup rounded="$3" borderWidth={0.5} borderColor="$color5" overflow="hidden">
          <XGroup.Item>
            <Link
              href="https://tamagui.dev/takeout"
              target="_blank"
              hideExternalIcon
              asChild
            >
              <XStack
                render="a"
                px="$2.5"
                py="$1.5"
                bg="$color2"
                cursor="pointer"
                hoverStyle={{ bg: '$color4' }}
                pressStyle={{ bg: '$color5' }}
              >
                <SizableText size="$4" fontFamily="$mono" color="$color11">
                  Pro
                </SizableText>
              </XStack>
            </Link>
          </XGroup.Item>
          <XGroup.Item>
            <Link
              href="https://github.com/tamagui/takeout-free"
              target="_blank"
              hideExternalIcon
              asChild
            >
              <XStack
                render="a"
                px="$2.5"
                py="$1.5"
                bg="$color2"
                borderLeftWidth={0.5}
                borderLeftColor="$color5"
                cursor="pointer"
                hoverStyle={{ bg: '$color4' }}
                pressStyle={{ bg: '$color5' }}
              >
                <SizableText size="$4" fontFamily="$mono" color="$color11">
                  Free
                </SizableText>
              </XStack>
            </Link>
          </XGroup.Item>
        </XGroup>
      </View>
    </Theme>
  )
}
