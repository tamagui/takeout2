import { createSystemFont, fonts as baseFonts } from '@tamagui/config/v5'
import { withTailwindTypeScale } from '@tamagui/config/v6'
import { isWeb } from 'tamagui'

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
  heading: withTailwindTypeScale(baseFonts.heading),
  body: withTailwindTypeScale({
    ...baseFonts.body,
    weight: {
      4: '400',
    },
  }),
  mono: withTailwindTypeScale(mono),
}
