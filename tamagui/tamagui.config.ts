import { defaultConfig, settings as v6Settings, toV6Themes } from '@tamagui/config/v6'
import { defaultConfig as takeoutConfig } from '@tamagui/config/v5'
import { animationsRoot } from 'contrast-ui/animations/animationsRoot'
import { createTamagui } from 'tamagui'
import { fonts } from './fonts'

function parseRgb(color: string): [number, number, number] | null {
  const c = color.trim()
  if (c.startsWith('#')) {
    const h = c.slice(1)
    if (h.length === 3)
      return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const m = c.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  return m ? [+m[1], +m[2], +m[3]] : null
}

function luminance(rgb: [number, number, number]): number {
  const lin = (c: number) =>
    c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])
}

export function deriveAccentColor(bg: string): string {
  const rgb = parseRgb(bg)
  return rgb && luminance(rgb) > 0.179 ? '#000000' : '#ffffff'
}

export function withAccessibleAccents<T extends Record<string, any>>(themes: T): T {
  const result: Record<string, any> = { ...themes }
  for (const [name, theme] of Object.entries(themes)) {
    if (theme && typeof theme === 'object' && 'accent-background' in theme) {
      const bg = theme['accent-background']
      if (typeof bg === 'string') {
        result[name] = {
          ...theme,
          'accent-color': deriveAccentColor(bg),
        }
      }
    }
  }
  for (const base of ['light', 'dark']) {
    const baseTheme = result[base]
    if (baseTheme && typeof baseTheme === 'object' && 'accent-background' in baseTheme) {
      const accentBg = baseTheme['accent-background']
      const accentColor = baseTheme['accent-color'] ?? deriveAccentColor(accentBg)
      for (const [name, theme] of Object.entries(result)) {
        if (!name.startsWith(base + '_')) continue
        if (
          name.startsWith(base + '_level') ||
          name.startsWith(base + '_accent') ||
          name.startsWith(base + '_brand')
        ) {
          result[name] = {
            ...theme,
            'accent-background': accentBg,
            'accent-color': accentColor,
            ...(name.startsWith(base + '_brand') || name.startsWith(base + '_accent')
              ? { background: accentBg, color: accentColor }
              : {}),
          }
        }
      }
    }
  }
  return result as T
}

const defaultAccentBg = '#7c3aed'
const takeoutThemes = toV6Themes(takeoutConfig.themes)

export const config = createTamagui({
  ...defaultConfig,
  // brand tint for the native tab bar (see skills/contrast-app-templates.md).
  // accent-background + accent-color always ship as a pair, deriving a passing
  // foreground (WCAG AA >= 4.5:1) from the chosen accent-background.
  themes: {
    ...withAccessibleAccents({
      ...defaultConfig.themes,
      light: {
        ...defaultConfig.themes.light,
        'accent-background': defaultAccentBg,
        'accent-color': deriveAccentColor(defaultAccentBg),
      },
      dark: {
        ...defaultConfig.themes.dark,
        'accent-background': defaultAccentBg,
        'accent-color': deriveAccentColor(defaultAccentBg),
      },
    }),
    light_takeout: takeoutThemes.light,
    dark_takeout: takeoutThemes.dark,
    light_takeout_accent: takeoutThemes.light_accent,
    dark_takeout_accent: takeoutThemes.dark_accent,
    light_takeout_blue: takeoutThemes.light_blue,
    dark_takeout_blue: takeoutThemes.dark_blue,
  },
  animations: animationsRoot,
  fonts,
  settings: {
    ...v6Settings,
    styleValueSyntax: 'string',
    onlyAllowShorthands: false,
    // react native positions an absolute child against its parent; the v6
    // `static` default anchors it to the initial containing block instead, so
    // an inset-0 child escapes its parent and swallows taps on the page.
    defaultPosition: 'relative',
  },
})

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}

  interface TypeOverride {
    groupNames(): 'button' | 'item' | 'frame'
  }
}
