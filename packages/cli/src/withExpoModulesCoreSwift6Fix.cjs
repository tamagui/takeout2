const { withDangerousMod } = require('@expo/config-plugins')
const fs = require('node:fs')
const path = require('node:path')

/**
 * expo config plugin to fix expo-modules-core 55.x swift 6 strict concurrency errors
 * that break TurboModule registration (PlatformConstants not found)
 * adapted from tamagui/kitchen-sink
 * see: https://github.com/expo/expo/issues/42525
 */
function withExpoModulesCoreSwift6Fix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile')

      if (!fs.existsSync(podfilePath)) {
        return config
      }

      let podfile = fs.readFileSync(podfilePath, 'utf8')

      if (podfile.includes('# workaround: expo-modules-core 55.x')) {
        return config
      }

      const workaround = `
    # workaround: expo-modules-core 55.x requires Swift 6 mode with isolated
    # conformances (SE-0470) for @MainActor in protocol conformance syntax.
    # SWIFT_STRICT_CONCURRENCY=minimal suppresses concurrency warnings/errors.
    installer.pods_project.targets.each do |target|
      if target.name == 'ExpoModulesCore'
        target.build_configurations.each do |build_config|
          build_config.build_settings['SWIFT_VERSION'] = '6'
          build_config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
          flags = build_config.build_settings['OTHER_SWIFT_FLAGS'] || '$(inherited)'
          unless flags.include?('IsolatedConformances')
            build_config.build_settings['OTHER_SWIFT_FLAGS'] = "#{flags} -enable-upcoming-feature IsolatedConformances"
          end
        end
      end
    end
`
      const updated = podfile.replace(
        /(post_install do \|installer\|.*?)(^\s+end\s*\nend)/ms,
        `$1${workaround}$2`,
      )

      if (updated !== podfile) {
        fs.writeFileSync(podfilePath, updated)
      }

      return config
    },
  ])
}

module.exports = withExpoModulesCoreSwift6Fix
