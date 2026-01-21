import { Theme, XGroup, XStack, SizableText } from 'tamagui'

import { Link } from '~/interface/app/Link'

export const ProFreeButtons = () => {
  return (
    <Theme name="black">
      <XGroup
        rounded="$3"
        borderWidth={0.5}
        borderColor="$color5"
        overflow="hidden"
        ml="$3"
        display="none"
        $md={{ display: 'flex' }}
      >
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
              hoverStyle={{
                bg: '$color4',
              }}
              pressStyle={{
                bg: '$color5',
              }}
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
              hoverStyle={{
                bg: '$color4',
              }}
              pressStyle={{
                bg: '$color5',
              }}
            >
              <SizableText size="$4" fontFamily="$mono" color="$color11">
                Free
              </SizableText>
            </XStack>
          </Link>
        </XGroup.Item>
      </XGroup>
    </Theme>
  )
}
