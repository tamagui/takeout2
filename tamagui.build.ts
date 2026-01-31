export default {
  // optimize true in dev mode for nice inline data- attributes pointing to fs
  optimize: true,
  // but only actually flattne/extract in production
  disableExtraction: process.env.NODE_ENV !== 'production',
  components: ['tamagui'],
  config: './src/tamagui/tamagui.config.ts',
  outputCSS: './src/tamagui/tamagui.css',
}
