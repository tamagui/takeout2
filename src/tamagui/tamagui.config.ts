import {
  createSystemFont,
  mediaQueryDefaultActive,
  shorthands,
  tokens,
} from '@tamagui/config/v4'
import { createTamagui, isWeb } from 'tamagui'
import { animations } from './animations'
import { breakpoints } from './breakpoints'
import { themes } from './themes-out'

const body = createSystemFont({
  font: {
    size: {
      1: 11,
      2: 12,
      3: 13,
      4: 14,
      true: 14,
      5: 16,
      6: 18,
      7: 20,
      8: 23,
      9: 32,
      10: 38,
      11: 44,
      12: 52,
      13: 60,
      14: 70,
      15: 85,
      16: 100,
    },
    weight: {
      0: '400',
    },
  },
  sizeSize: (x) => Math.round(x),
  sizeLineHeight: (x) => Math.round(x * 1.25 + 5),
})

const heading = createSystemFont({
  font: {
    weight: {
      0: '400',
    },
  },
  sizeSize: (x) => Math.round(x * 1.25),
  sizeLineHeight: (x) => Math.round(x * 1.33 + 10),
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
  animations,
  shorthands,
  tokens,
  themes,

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
    mediaQueryDefaultActive,
    defaultFont: 'body',
    fastSchemeChange: false,
    shouldAddPrefersColorThemes: true,
    disableRootThemeClass: true, // vxrn color scheme handles this
    themeClassNameOnRoot: true,
    onlyAllowShorthands: true,
    maxDarkLightNesting: 2,
    styleCompat: 'react-native',
    allowedStyleValues: 'somewhat-strict-web',
    disableSSR: true,
  },

  defaultProps: {
    Button: {
      fontFamily: '$mono',
      cursor: 'default',

      focusVisibleStyle: {
        outlineWidth: 3,
        outlineStyle: 'solid',
        outlineColor: '$background04',
      },
    },
  },
})

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}

  interface TypeOverride {
    groupNames(): 'button' | 'message' | 'icon' | 'item' | 'frame'
  }
}
