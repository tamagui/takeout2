import { createSystemFont } from '@tamagui/config/v5'
import { isWeb } from 'tamagui'

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
  sizeLineHeight: (x) => Math.round(x * 1.05 + 10),
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

export const fonts = {
  body,
  heading,
  mono,
}
