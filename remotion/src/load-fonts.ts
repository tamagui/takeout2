import { loadFont } from '@remotion/fonts'
import { staticFile } from 'remotion'

export const loadProjectFonts = async () => {
  await loadFont({
    family: 'PlaywriteAUTAS',
    url: staticFile('fonts/PlaywriteAUTAS-Regular.ttf'),
    weight: '400',
  })
}
