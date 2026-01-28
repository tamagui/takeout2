import { useState } from 'react'
import { Paragraph, styled, Text, Tooltip, TooltipGroup, View, XStack } from 'tamagui'

import { Link } from '~/interface/app/Link'
import { GithubLogoIcon } from '~/interface/icons/phosphor/GithubLogoIcon'
import { SparkleIcon } from '~/interface/icons/phosphor/SparkleIcon'

const tooltipDelay = { open: 0, close: 150 }

const PromoButton = styled(XStack, {
  items: 'center',
  justify: 'center',
  gap: '$2',
  minW: 72,
  px: '$2.5',
  py: '$2',
  rounded: '$4',
  cursor: 'pointer',
  bg: '$color3',
  borderWidth: 0.5,
  borderColor: '$color5',
  transition: 'quick',

  hoverStyle: {
    bg: '$color4',
    borderColor: '$color7',
    scale: 1.02,
  },

  pressStyle: {
    bg: '$color5',
    scale: 0.98,
  },
})

const PromoButtonText = styled(Text, {
  fontFamily: '$mono',
  fontWeight: '600',
  fontSize: '$2',
  letterSpacing: 0.5,
})

export function PromoLinksRow() {
  const [label, setLabel] = useState('')

  return (
    <TooltipGroup delay={tooltipDelay}>
      <Tooltip scope="promo-tooltip" offset={20} placement="bottom">
        <XStack gap="$2.5" items="center" justify="center" z={1000}>
          <Tooltip.Trigger
            scope="promo-tooltip"
            asChild
            onMouseEnter={() => setLabel('Pro — full features and support')}
          >
            <Link href="https://tamagui.dev/takeout" target="_blank" hideExternalIcon>
              <PromoButton theme="blue">
                <SparkleIcon size={14} color="$color10" />
                <PromoButtonText>Pro</PromoButtonText>
              </PromoButton>
            </Link>
          </Tooltip.Trigger>

          <View width={1} height={16} bg="$color6" />

          <Tooltip.Trigger
            scope="promo-tooltip"
            asChild
            onMouseEnter={() => setLabel('Free — open source starter kit')}
          >
            <Link
              href="https://github.com/tamagui/takeout-free"
              target="_blank"
              hideExternalIcon
            >
              <PromoButton>
                <GithubLogoIcon size={14} color="$color10" />
                <PromoButtonText>Free</PromoButtonText>
              </PromoButton>
            </Link>
          </Tooltip.Trigger>
        </XStack>

        <Tooltip.Content
          theme="accent"
          enableAnimationForPositionChange
          transition="medium"
          rounded="$3"
          px="$2.5"
          py="$1.5"
          enterStyle={{ y: -4, opacity: 0 }}
          exitStyle={{ y: -4, opacity: 0 }}
        >
          <Tooltip.Arrow size="$3" />
          <Paragraph fontFamily="$mono" size="$2">
            {label}
          </Paragraph>
        </Tooltip.Content>
      </Tooltip>
    </TooltipGroup>
  )
}
