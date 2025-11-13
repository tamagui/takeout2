import { MoonStarsIcon } from '~/interface/icons/phosphor/MoonStarsIcon'
import { SunIcon } from '~/interface/icons/phosphor/SunIcon'
import { setSchemeSetting, useColorScheme } from '@vxrn/color-scheme'
import { AnimatePresence, styled, View } from 'tamagui'
import type { SizeTokens } from 'tamagui'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'

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

export function ThemeSwitch({ size = '$2' }: { size?: SizeTokens }) {
  const [scheme] = useColorScheme()
  const isDark = scheme === 'dark'

  const iconSize = size === '$1' ? 16 : size === '$2' ? 20 : size === '$3' ? 24 : 28

  const handleToggleTheme = () => {
    // toggle between light and dark, not system
    setSchemeSetting(isDark ? 'light' : 'dark')
  }

  return (
    <ButtonSimple
      onPress={handleToggleTheme}
      animation="medium"
      size="medium"
      circular
      pressStyle={{ scale: 0.9, opacity: 0.8 }}
      hoverStyle={{ scale: 1.05 }}
    >
      <AnimatePresence>
        {!isDark && (
          <AnimatedIcon key="sun">
            <SunIcon size={iconSize} color="$yellow12" />
          </AnimatedIcon>
        )}
        {isDark && (
          <AnimatedIcon key="moon">
            <MoonStarsIcon size={iconSize} color="$blue10" fill="$blue10" />
          </AnimatedIcon>
        )}
      </AnimatePresence>
    </ButtonSimple>
  )
}

ThemeSwitch.title = 'Theme Switch'
