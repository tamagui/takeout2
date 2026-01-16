// v5 themes setup - uses createThemes with v5-style palettes
// component themes disabled to reduce CSS output size

import {
  blue,
  blueDark,
  green,
  greenDark,
  red,
  redDark,
  yellow,
  yellowDark,
} from '@tamagui/colors'
import { createThemes } from '@tamagui/theme-builder'

// v5-aligned palettes (from @tamagui/themes/v5)
const darkPalette = [
  '#050505',
  '#151515',
  '#191919',
  '#232323',
  '#282828',
  '#323232',
  '#424242',
  '#494949',
  '#545454',
  '#626262',
  '#a5a5a5',
  '#fff',
]

const lightPalette = [
  '#fff',
  '#f8f8f8',
  'hsl(0, 0%, 93%)',
  'hsl(0, 0%, 87%)',
  'hsl(0, 0%, 80%)',
  'hsl(0, 0%, 74%)',
  'hsl(0, 0%, 68%)',
  'hsl(0, 0%, 60%)',
  'hsl(0, 0%, 48%)',
  'hsl(0, 0%, 38%)',
  'hsl(0, 0%, 20%)',
  'hsl(0, 0%, 2%)',
]

// app-specific extra colors
const whiteBlack = {
  white: 'rgba(255,255,255,1)',
  white0: 'rgba(255,255,255,0)',
  white02: 'rgba(255,255,255,0.2)',
  white04: 'rgba(255,255,255,0.4)',
  white06: 'rgba(255,255,255,0.6)',
  white08: 'rgba(255,255,255,0.8)',
  black: 'rgba(0,0,0,1)',
  black0: 'rgba(0,0,0,0)',
  black02: 'rgba(0,0,0,0.2)',
  black04: 'rgba(0,0,0,0.4)',
  black06: 'rgba(0,0,0,0.6)',
  black08: 'rgba(0,0,0,0.8)',
}

const extraColorsDark = {
  highlight: `rgba(28,28,28, 1)`,
  highlight0: `rgba(28,28,28, 0)`,
  highlight02: `rgba(28,28,28, 0.2)`,
  highlight04: `rgba(28,28,28, 0.4)`,
  highlight06: `rgba(28,28,28, 0.6)`,
  highlight08: `rgba(28,28,28, 0.8)`,
  surface: '#1E1E1E',
  surface0: 'rgba(30, 30, 30, 0)',
  surface02: 'rgba(30, 30, 30, 0.2)',
  surface04: 'rgba(30, 30, 30, 0.4)',
  surface06: 'rgba(30, 30, 30, 0.6)',
  surface08: 'rgba(30, 30, 30, 0.8)',
  surface085: 'rgba(30, 30, 30, 0.85)',
  surface09: 'rgba(30, 30, 30, 0.9)',
  surface095: 'rgba(30, 30, 30, 0.95)',
  ...whiteBlack,
}

const extraColorsLight = {
  highlight: whiteBlack.white,
  highlight0: whiteBlack.white0,
  highlight02: whiteBlack.white02,
  highlight04: whiteBlack.white04,
  highlight06: whiteBlack.white06,
  highlight08: whiteBlack.white08,
  surface: '#f5f5f7',
  surface0: 'rgba(245, 245, 247, 0)',
  surface02: 'rgba(245, 245, 247, 0.2)',
  surface04: 'rgba(245, 245, 247, 0.4)',
  surface06: 'rgba(245, 245, 247, 0.6)',
  surface08: 'rgba(245, 245, 247, 0.8)',
  surface085: 'rgba(245, 245, 247, 0.85)',
  surface09: 'rgba(245, 245, 247, 0.9)',
  surface095: 'rgba(245, 245, 247, 0.95)',
  ...whiteBlack,
}

// v5-style shadow colors
const lightShadows = {
  shadow1: 'rgba(0,0,0,0.025)',
  shadow2: 'rgba(0,0,0,0.04)',
  shadow3: 'rgba(0,0,0,0.06)',
  shadow4: 'rgba(0,0,0,0.095)',
  shadow5: 'rgba(0,0,0,0.195)',
  shadow6: 'rgba(0,0,0,0.3)',
}

const darkShadows = {
  shadow1: 'rgba(0,0,0,0.1)',
  shadow2: 'rgba(0,0,0,0.18)',
  shadow3: 'rgba(0,0,0,0.25)',
  shadow4: 'rgba(0,0,0,0.4)',
  shadow5: 'rgba(0,0,0,0.55)',
  shadow6: 'rgba(0,0,0,0.66)',
}

// black/white color scales from v5
const blackColors = Object.fromEntries(
  darkPalette.map((color, i) => [`black${i + 1}`, color])
)
const whiteColors = Object.fromEntries(
  lightPalette.map((color, i) => [`white${i + 1}`, color])
)

export const themes = createThemes({
  // component themes disabled to reduce CSS output size
  componentThemes: {},

  base: {
    palette: {
      dark: darkPalette,
      light: lightPalette,
    },
    extra: {
      light: {
        ...blue,
        ...green,
        ...red,
        ...yellow,
        ...lightShadows,
        ...blackColors,
        ...whiteColors,
        shadowColor: lightShadows.shadow1,
        ...extraColorsLight,
      },
      dark: {
        ...blueDark,
        ...greenDark,
        ...redDark,
        ...yellowDark,
        ...darkShadows,
        ...blackColors,
        ...whiteColors,
        shadowColor: darkShadows.shadow1,
        ...extraColorsDark,
      },
    },
  },

  accent: {
    palette: {
      dark: lightPalette,
      light: darkPalette,
    },
  },

  childrenThemes: {
    blue: {
      palette: {
        dark: Object.values(blueDark),
        light: Object.values(blue),
      },
    },
    green: {
      palette: {
        dark: Object.values(greenDark),
        light: Object.values(green),
      },
    },
    red: {
      palette: {
        dark: Object.values(redDark),
        light: Object.values(red),
      },
    },
    yellow: {
      palette: {
        dark: Object.values(yellowDark),
        light: Object.values(yellow),
      },
    },
  },
})
