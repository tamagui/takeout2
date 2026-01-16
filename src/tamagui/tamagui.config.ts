import {
  defaultConfig,
  mediaQueryDefaultActive,
  shorthands,
  tokens,
} from '@tamagui/config/v5'
import { createTamagui } from 'tamagui'

import { animationsRoot } from './animationsRoot'
import { breakpoints } from './breakpoints'
import { fonts } from './fonts'
import { themes as themesJS } from './themes-out'

export const config = createTamagui({
  animations: animationsRoot,
  shorthands,
  tokens,

  // tamagui optimization - reduce bundle size by avoiding themes js on client
  // tamagui will hydrate it from CSS which improves lighthouse scores
  themes: process.env.VITE_ENVIRONMENT === 'client' ? ({} as typeof themesJS) : themesJS,

  media: {
    pointerTouch: { pointer: 'coarse' },

    heightXXXS: { minHeight: breakpoints.xxxs },
    heightXXS: { minHeight: breakpoints.xxs },
    heightXS: { minHeight: breakpoints.xs },
    heightSM: { minHeight: breakpoints.sm },
    heightMD: { minHeight: breakpoints.md },
    heightLG: { minHeight: breakpoints.lg },

    maxXXXS: { maxWidth: breakpoints.xxxs },
    maxXXS: { maxWidth: breakpoints.xxs },
    maxXS: { maxWidth: breakpoints.xs },
    maxSM: { maxWidth: breakpoints.sm },
    maxMD: { maxWidth: breakpoints.md },
    maxLG: { maxWidth: breakpoints.lg },
    maxXL: { maxWidth: breakpoints.xl },
    maxXXL: { maxWidth: breakpoints.xxl },

    xxxs: { minWidth: breakpoints.xxxs },
    xxs: { minWidth: breakpoints.xxs },
    xs: { minWidth: breakpoints.xs },
    sm: { minWidth: breakpoints.sm },
    md: { minWidth: breakpoints.md },
    lg: { minWidth: breakpoints.lg },
    xl: { minWidth: breakpoints.xl },
    xxl: { minWidth: breakpoints.xxl },
  },

  fonts,

  selectionStyles: (theme) =>
    theme.color5
      ? {
          backgroundColor: theme.color5,
          color: theme.color11,
        }
      : null,

  settings: {
    ...defaultConfig.settings,
    mediaQueryDefaultActive,
    defaultFont: 'body',
    fastSchemeChange: true,
    shouldAddPrefersColorThemes: true,
    addThemeClassName: 'html',
    onlyAllowShorthands: true,
    maxDarkLightNesting: 1,
    allowedStyleValues: 'somewhat-strict-web',
    // v5: align flex defaults with react native
    styleCompat: 'react-native',
  },
})

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}

  interface TypeOverride {
    groupNames(): 'button' | 'message' | 'icon' | 'item' | 'frame' | 'card'
  }
}
