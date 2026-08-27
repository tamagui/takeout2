import type { TamaguiBuildOptions } from 'tamagui'

export default {
  components: ['tamagui'],
  config: './src/tamagui/tamagui.config.ts',
  outputCSS: './src/tamagui/tamagui.css',
} satisfies TamaguiBuildOptions
