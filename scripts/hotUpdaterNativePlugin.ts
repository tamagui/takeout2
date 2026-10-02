import { transformAsync } from '@babel/core'
import type { Plugin } from 'rolldown'

// One runs native Rolldown plugins in both development and release bundles.
// Keep Hot Updater's own transform, including its BUILD_OUT_DIR/BUNDLE_ID handling.
export function hotUpdaterNativePlugin(): Plugin {
  return {
    name: 'takeout:hot-updater',
    async transform(code, id) {
      if (!/\.[cm]?[jt]sx?$/.test(id)) return
      if (
        !code.includes('__HOT_UPDATER_BUNDLE_ID') &&
        !(code.includes('filePath') && code.includes('.html'))
      ) {
        return
      }

      const result = await transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        presets: [['@babel/preset-typescript', { allExtensions: true, isTSX: true }]],
        plugins: ['hot-updater/babel-plugin'],
      })
      if (result?.code) return { code: result.code, map: result.map }
    },
  }
}
