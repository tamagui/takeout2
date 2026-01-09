const { withDangerousMod } = require('@expo/config-plugins')
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode')
const fs = require('node:fs')
const path = require('node:path')

/**
 * expo config plugin to add pre_install hook for op-sqlite static framework compilation
 * required when using useFrameworks: 'static'
 * based on: https://github.com/OP-Engineering/op-sqlite/issues/238
 */
function withOpSqliteStatic(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile')

      if (!fs.existsSync(podfilePath)) {
        return config
      }

      const podfileContent = fs.readFileSync(podfilePath, 'utf-8')

      const setOpSqliteStatic = mergeContents({
        tag: 'op-sqlite-static-library',
        src: podfileContent,
        newSrc: `pre_install do |installer|
  installer.pod_targets.each do |pod|
    if pod.name.eql?('op-sqlite')
      def pod.build_type
        Pod::BuildType.static_library
      end
    end
  end
end`,
        anchor: /platform :ios.*/,
        offset: 1,
        comment: '#',
      })

      if (!setOpSqliteStatic.didMerge) {
        return config
      }

      fs.writeFileSync(podfilePath, setOpSqliteStatic.contents)

      return config
    },
  ])
}

module.exports = withOpSqliteStatic
