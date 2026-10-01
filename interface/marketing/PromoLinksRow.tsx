import { Tooltip } from 'contrast-ui/tooltip/Tooltip'
import { styled, Text, View, XStack } from 'tamagui'
import { Link } from '~/interface/app/Link'
import { GithubLogoIcon, SparkleIcon } from './TakeoutIcons'

const PromoButton = styled(XStack, {
  items: 'center',
  justify: 'center',
  gap: 8,
  minW: 72,
  px: 10,
  py: 8,
  rounded: 8,
  cursor: 'pointer',
  bg: 'color-3 hover:color-4 press:color-5',
  borderWidth: 0.5,
  borderColor: 'color-5 hover:color-7',
  transition: 'quick',
})

const PromoButtonText = styled(Text, {
  fontFamily: 'takeout-mono',
  fontWeight: '600',
  fontSize: 13,
  letterSpacing: 0.5,
  color: 'color-11',
})

export function PromoLinksRow() {
  return (
    <XStack gap={10} items="center" justify="center" z={1000}>
      <Tooltip label="Pro — full features and support" placement="bottom">
        <View>
          <Link href="https://tamagui.dev/takeout" target="_blank">
            <PromoButton>
              <SparkleIcon size={14} color="#3b82f6" />
              <PromoButtonText>Pro</PromoButtonText>
            </PromoButton>
          </Link>
        </View>
      </Tooltip>

      <View width={1} height={16} bg="color-6" />

      <Tooltip label="Free — open source starter kit" placement="bottom">
        <View>
          <Link href="https://github.com/tamagui/takeout-free" target="_blank">
            <PromoButton>
              <GithubLogoIcon size={14} />
              <PromoButtonText>Free</PromoButtonText>
            </PromoButton>
          </Link>
        </View>
      </Tooltip>
    </XStack>
  )
}
