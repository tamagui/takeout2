import { toV6Themes } from '@tamagui/config/v6'
import { themes as v5Themes } from '@tamagui/themes/v5'

const v6Themes = toV6Themes(v5Themes)

export const themes = {
  ...v6Themes,
  light_brand: v6Themes.light_accent,
  dark_brand: v6Themes.dark_accent,
}
