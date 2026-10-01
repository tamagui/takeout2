import { fonts as baseFonts, withTailwindTypeScale } from '@tamagui/config/v6'
import { createSystemFont, fonts as takeoutFonts } from '@tamagui/config/v5'
import { createFont, isWeb } from 'tamagui'

const mono = createFont({
  ...baseFonts.body,
  // JetBrains Mono is not bundled as a native face, and the app template's
  // web <head> does not link it, so use a real native monospace stack and a
  // web stack that still prefers JetBrains Mono when a project later links it.
  family: isWeb ? 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace' : 'Menlo',
  weight: {
    ...baseFonts.body.weight,
    4: '400',
  },
})

export const fonts = {
  ...baseFonts,
  body: withTailwindTypeScale({
    ...baseFonts.body,
    size: {
      ...baseFonts.body.size,
      iosBody: 17,
      iosSubheadline: 15,
    },
    lineHeight: {
      ...baseFonts.body.lineHeight,
      iosBody: 22,
      iosSubheadline: 20,
    },
    weight: {
      4: '400',
    },
  }),
  mono: withTailwindTypeScale(mono),
  'takeout-body': takeoutFonts.body,
  'takeout-heading': takeoutFonts.heading,
  'takeout-mono': createSystemFont({
    sizes: Object.fromEntries(
      Object.entries(takeoutFonts.body.size).map(([key, size]) => [key, parseFloat(String(size))]),
    ),
    sizeLineHeight: (size) => (size >= 16 ? size * 1.2 + 8 : size * 1.15 + 5),
    font: {
      family: isWeb ? '"JetBrains Mono", monospace' : 'JetBrains Mono',
      weight: { 0: '400' },
    },
  }),
}
