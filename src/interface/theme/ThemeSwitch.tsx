import { useUserScheme } from '@vxrn/color-scheme'
import { memo, useCallback, useMemo } from 'react'
import { styled, View } from 'tamagui'

import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { CircleHalfIcon } from '~/interface/icons/phosphor/CircleHalfIcon'
import { MoonStarsIcon } from '~/interface/icons/phosphor/MoonStarsIcon'
import { SunIcon } from '~/interface/icons/phosphor/SunIcon'

import { TooltipSimple } from '../tooltip/TooltipSimple'

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

export const ThemeSwitch = memo(({ size = '$2' }: { size?: SizeTokens }) => {
  const { onPress, setting } = useToggleTheme()

  const iconSize = size === '$1' ? 16 : size === '$2' ? 20 : size === '$3' ? 24 : 28

  return (
    <View items="center" gap="$1">
      <TooltipSimple label={setting[0]?.toUpperCase() + setting.slice(1)}>
        <ButtonSimple
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
        </ButtonSimple>
      </TooltipSimple>
    </View>
  )
})

export function useToggleTheme() {
  const userScheme = useUserScheme()

  const Icon = useMemo(() =>
    userScheme.setting === 'system'
      ? CircleHalfIcon
      : userScheme.setting === 'dark'
        ? MoonStarsIcon
        : SunIcon,
    [userScheme.setting]
  )

  const onPress = useCallback(() => {
    const currentIndex = schemeSettings.indexOf(userScheme.setting)
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % 3 : 0
    const next = schemeSettings[nextIndex]!
    userScheme.set(next)
  }, [userScheme])

  return useMemo(() => ({
    setting: userScheme.setting,
    scheme: userScheme.value,
    Icon,
    onPress,
  }), [userScheme.setting, userScheme.value, Icon, onPress])
}

// @ts-expect-error adding display name for debugging
ThemeSwitch.title = 'Theme Switch'
