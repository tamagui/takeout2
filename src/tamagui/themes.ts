import { toV6Themes } from '@tamagui/config/v6'
import { themes as v5Themes } from '@tamagui/themes/v5'

const v6Themes = toV6Themes(v5Themes)

export const themes = {
  ...v6Themes,
  // brand is the app's one rename seam; v5 `accent` is the inverted grayscale
  // subtheme, so pointing brand at it renders dark-in-light (and colorless).
  // blue is what main shipped
  light_brand: v6Themes.light_blue,
  dark_brand: v6Themes.dark_blue,
}
