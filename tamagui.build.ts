export default {
  optimize: true,
  disableExtraction: process.env.NODE_ENV !== 'production',
  components: ['tamagui'],
  config: './src/tamagui/tamagui.config.ts',
  outputCSS: './src/tamagui/tamagui.css',
}
