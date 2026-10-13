import { Tooltip } from 'takeout-ui/tooltip/Tooltip'
import { setUserScheme, useUserScheme } from 'one'
import { Button } from '~/interface/buttons/Button'
import { CircleHalfIcon, MoonStarsIcon, SunIcon } from './TakeoutIcons'

const schemeSettings = ['light', 'dark', 'system'] as const

export function ThemeSwitch() {
  const userScheme = useUserScheme()
  const setting = userScheme.setting

  const onPress = () => {
    const currentIndex = schemeSettings.findIndex((scheme) => scheme === setting)
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % 3 : 0
    setUserScheme(schemeSettings[nextIndex]!)
  }

  const label = setting ? setting[0]!.toUpperCase() + setting.slice(1) : 'Theme'

  return (
    <Tooltip label={label}>
      <Button
        circular
        size="sm"
        variant="quiet"
        aria-label="Toggle theme"
        data-theme-setting={setting}
        onPress={onPress}
      >
        {setting === 'light' ? (
          <SunIcon size={18} />
        ) : setting === 'dark' ? (
          <MoonStarsIcon size={18} />
        ) : (
          <CircleHalfIcon size={18} />
        )}
      </Button>
    </Tooltip>
  )
}
