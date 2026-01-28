import { useUserScheme } from '@vxrn/color-scheme'
import { styled, View } from 'tamagui'

import { Button } from '~/interface/buttons/Button'
import { CircleHalfIcon } from '~/interface/icons/phosphor/CircleHalfIcon'
import { MoonStarsIcon } from '~/interface/icons/phosphor/MoonStarsIcon'
import { SunIcon } from '~/interface/icons/phosphor/SunIcon'

import { Tooltip } from '../tooltip/Tooltip'

import type { SizeTokens } from 'tamagui'

const IconContainer = styled(View, {
  transition: 'quick',
  position: 'absolute',
  opacity: 0,
  pointerEvents: 'none',

  variants: {
    active: {
      true: {
        opacity: 1,
      },
    },
  } as const,
})

const schemeSettings = ['light', 'dark', 'system'] as const

export function ThemeSwitch({ size = '$2' }: { size?: SizeTokens }) {
  const { onPress, setting } = useToggleTheme()

  const iconSize = size === '$1' ? 16 : size === '$2' ? 20 : size === '$3' ? 24 : 28

  return (
    <View items="center" gap="$1">
      <Tooltip label={setting[0]?.toUpperCase() + setting.slice(1)}>
        <Button
          onPress={onPress}
          transition="medium"
          size="medium"
          circular
          keepTooltipOpen
          pressStyle={{ scale: 0.9, opacity: 0.8 }}
          hoverStyle={{ scale: 1.05 }}
          aria-label="Toggle theme"
        >
          <IconContainer active={setting === 'light'}>
            <SunIcon size={iconSize} />
          </IconContainer>
          <IconContainer active={setting === 'dark'}>
            <MoonStarsIcon size={iconSize} />
          </IconContainer>
          <IconContainer active={setting === 'system'}>
            <CircleHalfIcon size={iconSize} />
          </IconContainer>
        </Button>
      </Tooltip>
    </View>
  )
}

export function useToggleTheme() {
  const userScheme = useUserScheme()

  const Icon =
    userScheme.setting === 'system'
      ? CircleHalfIcon
      : userScheme.setting === 'dark'
        ? MoonStarsIcon
        : SunIcon

  const onPress = () => {
    const currentIndex = schemeSettings.indexOf(userScheme.setting)
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % 3 : 0
    const next = schemeSettings[nextIndex]!
    userScheme.set(next)
  }

  return {
    setting: userScheme.setting,
    scheme: userScheme.value,
    Icon,
    onPress,
  }
}

ThemeSwitch.title = 'Theme Switch'
