import { SizableText, Theme, View, XGroup, XStack } from 'tamagui'

import { Link } from '~/interface/app/Link'
import { ArrowUpRightIcon } from '~/interface/icons/phosphor/ArrowUpRightIcon'

export const ProFreeButtons = () => {
  return (
    <View ml="3">
      <XGroup rounded="3" borderWidth={0.5} borderColor="color5" overflow="hidden">
        <XGroup.Item>
          <Theme name="blue">
            <Link
              href="https://tamagui.dev/takeout"
              target="_blank"
              hideExternalIcon
              asChild
            >
              <XStack
                render="a"
                px="2-5"
                py="1-5"
                bg="color4 hover:color5 press:color6"
                cursor="pointer"
                gap="1-5"
              >
                <SizableText size="3" fontFamily="mono" fontWeight="600" color="color11">
                  Pro
                </SizableText>
                <View y={1} mr={-4}>
                  <ArrowUpRightIcon size={10} opacity={0.5} />
                </View>
              </XStack>
            </Link>
          </Theme>
        </XGroup.Item>
        <XGroup.Item>
          <Link
            href="https://github.com/tamagui/takeout2"
            target="_blank"
            hideExternalIcon
            asChild
          >
            <XStack
              render="a"
              px="2-5"
              py="1-5"
              bg="color2 hover:color3 press:color4"
              borderLeftWidth={0.5}
              borderLeftColor="color5"
              cursor="pointer"
              gap="1-5"
            >
              <SizableText size="3" fontFamily="mono" color="color10">
                Free
              </SizableText>
              <View y={1} mr={-4}>
                <ArrowUpRightIcon size={10} opacity={0.4} />
              </View>
            </XStack>
          </Link>
        </XGroup.Item>
      </XGroup>
    </View>
  )
}
