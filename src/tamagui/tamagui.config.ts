import {
  defaultConfig,
  createSystemFont,
  mediaQueryDefaultActive,
  shorthands,
  tokens,
} from '@tamagui/config/v5'
import { createTamagui, isWeb } from 'tamagui'

import { animationsRoot } from './animationsRoot'
import { breakpoints } from './breakpoints'
import { themes as themesJS } from './themes-out'

const baseFontSizes = {
  1: 11,
  2: 12,
  3: 13,
  4: 15,
  true: 15,
  5: 16,
  6: 18,
  7: 22,
  8: 26,
  9: 30,
  10: 40,
  11: 46,
  12: 52,
  13: 60,
  14: 70,
  15: 85,
  16: 100,
}

const body = createSystemFont({
  font: {
    size: baseFontSizes,
    weight: {
      0: '400',
    },
  },
  sizeSize: (x) => Math.round(x),
  sizeLineHeight: (x) => Math.round(x * 1.35 + 6),
})

const heading = createSystemFont({
  font: {
    size: baseFontSizes,
    weight: {
      0: '600',
    },
  },
  sizeSize: (x) => Math.round(x * 1),
  sizeLineHeight: (x) => Math.round(x * 1.12 + 5),
})

const mono = createSystemFont({
  sizeLineHeight: (size) => (size >= 16 ? size * 1.2 + 8 : size * 1.15 + 5),
  font: {
    family: isWeb ? '"JetBrains Mono", monospace' : 'JetBrains Mono',
    weight: {
      0: '400',
    },
  },
})

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

  fonts: {
    body,
    heading,
    mono,
  },

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
  },
})

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}

  interface TypeOverride {
    groupNames(): 'button' | 'message' | 'icon' | 'item' | 'frame' | 'card'
  }
}
