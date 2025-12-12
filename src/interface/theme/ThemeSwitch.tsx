import { useUserScheme } from '@vxrn/color-scheme'
import { AnimatePresence, Paragraph, styled, View, YStack, TooltipSimple } from 'tamagui'

import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { MoonStarsIcon } from '~/interface/icons/phosphor/MoonStarsIcon'
import { SunIcon } from '~/interface/icons/phosphor/SunIcon'
import { SunMoonIcon } from '~/interface/icons/phosphor/SunMoonIcon'

import type { SizeTokens } from 'tamagui'

const AnimatedIcon = styled(View, {
  animation: 'medium',
  opacity: 1,
  scale: 1,
  position: 'absolute',

  enterStyle: {
    scale: 0.5,
    opacity: 0,
    rotate: '-180deg',
  },

  exitStyle: {
    scale: 0.5,
    opacity: 0,
    rotate: '180deg',
  },
})

const schemeSettings = ['light', 'dark', 'system'] as const

export function ThemeSwitch({ size = '$2' }: { size?: SizeTokens }) {
  const { onPress, setting } = useToggleTheme()

  const iconSize = size === '$1' ? 16 : size === '$2' ? 20 : size === '$3' ? 24 : 28

  return (
    <View items="center" gap="$1">
      <TooltipSimple
        groupId="header-theme-switch"
        label={setting[0]?.toUpperCase() + setting.slice(1)}
      >
        <ButtonSimple
          onPress={onPress}
          animation="medium"
          size="medium"
          circular
          pressStyle={{ scale: 0.9, opacity: 0.8 }}
          hoverStyle={{ scale: 1.05 }}
          aria-label="Toggle theme"
        >
          <AnimatePresence>
            {setting === 'light' && (
              <AnimatedIcon key="sun">
                <SunIcon size={iconSize} />
              </AnimatedIcon>
            )}
            {setting === 'dark' && (
              <AnimatedIcon key="moon">
                <MoonStarsIcon size={iconSize} />
              </AnimatedIcon>
            )}
            {setting === 'system' && (
              <AnimatedIcon key="system">
                <SunMoonIcon size={iconSize} />
              </AnimatedIcon>
            )}
          </AnimatePresence>
        </ButtonSimple>
      </TooltipSimple>
    </View>
  )
}

export function useToggleTheme() {
  const userScheme = useUserScheme()
  const Icon =
    userScheme.setting === 'system'
      ? SunMoonIcon
      : userScheme.setting === 'dark'
        ? MoonStarsIcon
        : SunIcon

  return {
    setting: userScheme.setting,
    scheme: userScheme.value,
    Icon,
    onPress: () => {
      const currentIndex = schemeSettings.indexOf(userScheme.setting)
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % 3 : 0
      const next = schemeSettings[nextIndex]!
      userScheme.set(next)
    },
  }
}

ThemeSwitch.title = 'Theme Switch'
