# native ios/android testing & ci/cd implementation plan

## executive summary

comprehensive plan to implement production-ready native ios/android testing with appium and ci/cd using warp runners. based on proven patterns from ~/chat and ~/tamagui repositories with complete file references for implementation.

**current state**: basic ios github actions exist, no native testing automation, no android ci/cd
**target state**: full ios/android appium testing + automated ci/cd with warp runners

## technology stack

- **warp runners**: macos runners for ios builds/tests (currently used in chat)
- **appium + webdriverio**: mobile e2e testing (proven in tamagui kitchen-sink)
- **github actions**: ci/cd orchestration
- **vitest**: test runner (already in use)
- **expo/one**: build tooling

## reference repositories

### ~/chat - production ios ci/cd
**workflows:**
- `/Users/n8/chat/.github/workflows/build-ios-app.yml` - core ios build
- `/Users/n8/chat/.github/workflows/build-ios-app-cached.yml` - cached builds
- `/Users/n8/chat/.github/workflows/ios-cd.yml` - testflight deployment
- `/Users/n8/chat/.github/workflows/test-native-ios.yml` - test template (disabled)

**actions:**
- `/Users/n8/chat/.github/actions/install/action.yml` - dependency setup
- `/Users/n8/chat/.github/actions/install-maestro/action.yml` - maestro install (we'll adapt for appium)

**configuration:**
- `/Users/n8/chat/app.config.ts` - expo config with new arch
- `/Users/n8/chat/ios/Podfile` - ios dependencies
- `/Users/n8/chat/.xcode-version` - xcode 26.0 beta 6

### ~/tamagui/code/kitchen-sink - production appium testing
**test infrastructure:**
- `/Users/n8/tamagui/code/kitchen-sink/vitest.config.ios.mts` - ios test config
- `/Users/n8/tamagui/code/kitchen-sink/testing-utils/getWebDriverConfig.ts` - appium setup
- `/Users/n8/tamagui/code/kitchen-sink/testing-utils/global-setup.ts` - test env
- `/Users/n8/tamagui/code/kitchen-sink/tests/sample.test.ios.tsx` - example test

## phase 1: appium test infrastructure (week 1)

### 1.1 install appium dependencies

create `.github/actions/install-appium/action.yml`:

```yaml
name: install appium
description: install appium server and drivers for ios/android testing

runs:
  using: composite
  steps:
    - name: install appium
      shell: bash
      run: |
        npm install -g appium@next
        appium driver install xcuitest
        appium driver install uiautomator2

    - name: verify installation
      shell: bash
      run: |
        appium --version
        appium driver list --installed
```

add to package.json:
```json
{
  "devDependencies": {
    "@wdio/cli": "^9.5.4",
    "@wdio/local-runner": "^9.5.4",
    "@wdio/mocha-framework": "^9.5.4",
    "@wdio/appium-service": "^9.5.4",
    "webdriverio": "^9.5.4",
    "appium": "^2.15.1",
    "appium-xcuitest-driver": "^7.36.4",
    "appium-uiautomator2-driver": "^3.9.2"
  }
}
```

### 1.2 create webdriver configuration

create `testing-utils/mobile/getWebDriverConfig.ts` (adapted from tamagui):

```typescript
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

let cachedConfig: any = null

export async function getWebDriverConfig(platform: 'ios' | 'android') {
  if (cachedConfig) return cachedConfig

  if (platform === 'ios') {
    cachedConfig = {
      platformName: 'iOS',
      'appium:options': {
        automationName: 'XCUITest',
        udid: getSimulatorUdid(),
        app: await getBuiltAppPath('ios'),
        platformVersion: '18.0',
        deviceName: 'iPhone 16 Pro',
      },
      hostname: 'localhost',
      port: 4723,
      connectionRetryTimeout: 5 * 60 * 1000,
    }
  } else {
    cachedConfig = {
      platformName: 'Android',
      'appium:options': {
        automationName: 'UiAutomator2',
        deviceName: 'Android Emulator',
        app: await getBuiltAppPath('android'),
      },
      hostname: 'localhost',
      port: 4723,
      connectionRetryTimeout: 5 * 60 * 1000,
    }
  }

  return cachedConfig
}

function getSimulatorUdid(): string {
  // find booted simulator or boot one
  const output = execSync(
    'xcrun simctl list devices available --json',
  ).toString()
  const devices = JSON.parse(output)

  for (const runtime of Object.keys(devices.devices)) {
    if (!runtime.includes('iOS-18')) continue

    const iosDevices = devices.devices[runtime]
    const iphone16Pro = iosDevices.find((d: any) =>
      d.name.includes('iPhone 16 Pro'),
    )

    if (iphone16Pro) {
      // boot if not booted
      if (iphone16Pro.state !== 'Booted') {
        execSync(`xcrun simctl boot ${iphone16Pro.udid}`)
      }
      return iphone16Pro.udid
    }
  }

  throw new Error('iPhone 16 Pro simulator not found')
}

async function getBuiltAppPath(platform: 'ios' | 'android'): Promise<string> {
  if (platform === 'ios') {
    // look for built .app in ios/build
    const appPath = 'ios/build/Build/Products/Debug-iphonesimulator/App.app'
    if (existsSync(appPath)) {
      return appPath
    }
    throw new Error(`iOS app not found at ${appPath}. Run build first.`)
  } else {
    // look for built apk
    const apkPath = 'android/app/build/outputs/apk/debug/app-debug.apk'
    if (existsSync(apkPath)) {
      return apkPath
    }
    throw new Error(`Android apk not found at ${apkPath}. Run build first.`)
  }
}
```

### 1.3 create test utilities

create `testing-utils/mobile/helpers.ts`:

```typescript
import type { Browser } from 'webdriverio'

export async function login(
  driver: Browser,
  email: string,
  password: string,
) {
  const emailField = await driver.$('~email-input')
  await emailField.setValue(email)

  const passwordField = await driver.$('~password-input')
  await passwordField.setValue(password)

  const submitButton = await driver.$('~submit-button')
  await submitButton.click()

  // wait for login to complete
  const welcomeText = await driver.$('~welcome-message')
  await welcomeText.waitForDisplayed({ timeout: 10000 })
}

export async function logout(driver: Browser) {
  const profileButton = await driver.$('~profile-button')
  await profileButton.click()

  const logoutButton = await driver.$('~logout-button')
  await logoutButton.click()
}

export async function waitForElement(
  driver: Browser,
  selector: string,
  timeout = 10000,
) {
  const element = await driver.$(selector)
  await element.waitForDisplayed({ timeout })
  return element
}

export async function scrollToElement(driver: Browser, selector: string) {
  const element = await driver.$(selector)
  await element.scrollIntoView()
  return element
}
```

### 1.4 create vitest config for mobile

create `vitest.config.ios.mts` (based on tamagui pattern):

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './testing-utils/mobile/global-setup.ts',
    include: ['**/*.{test.ios,spec.ios}.?(c|m)[jt]s?(x)'],
    retry: 1,
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
})
```

create `vitest.config.android.mts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './testing-utils/mobile/global-setup.ts',
    include: ['**/*.{test.android,spec.android}.?(c|m)[jt]s?(x)'],
    retry: 1,
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
})
```

create `testing-utils/mobile/global-setup.ts`:

```typescript
import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'

let appiumServer: ChildProcess | null = null

export async function setup() {
  console.info('starting appium server...')

  appiumServer = spawn('appium', ['--log-timestamp', '--allow-insecure'], {
    stdio: 'inherit',
  })

  // wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 5000))

  console.info('appium server started')
}

export async function teardown() {
  console.info('stopping appium server...')

  if (appiumServer) {
    appiumServer.kill()
    appiumServer = null
  }

  console.info('appium server stopped')
}
```

### 1.5 create initial test suite

create `tests/e2e/ios/smoke.test.ios.tsx`:

```typescript
import { remote } from 'webdriverio'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getWebDriverConfig } from '../../../testing-utils/mobile/getWebDriverConfig'
import type { Browser } from 'webdriverio'

const sharedTestOptions = {
  timeout: 60000,
}

describe('ios smoke tests', () => {
  let driver: Browser

  beforeAll(async () => {
    driver = await remote(await getWebDriverConfig('ios'))
  }, 60000)

  afterAll(async () => {
    await driver?.deleteSession()
  }, 60000)

  it('app launches successfully', sharedTestOptions, async () => {
    // look for any text indicating app loaded
    const appElement = await driver.$('//*[@label]')
    await appElement.waitForDisplayed({ timeout: 20000 })
    expect(await appElement.isDisplayed()).toBe(true)
  })

  it('can navigate to main screen', sharedTestOptions, async () => {
    const homeButton = await driver.$('~home-tab')
    await homeButton.waitForDisplayed({ timeout: 10000 })
    await homeButton.click()

    const homeContent = await driver.$('~home-content')
    await homeContent.waitForDisplayed({ timeout: 10000 })
    expect(await homeContent.isDisplayed()).toBe(true)
  })
})
```

create `tests/e2e/android/smoke.test.android.tsx`:

```typescript
import { remote } from 'webdriverio'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getWebDriverConfig } from '../../../testing-utils/mobile/getWebDriverConfig'
import type { Browser } from 'webdriverio'

const sharedTestOptions = {
  timeout: 60000,
}

describe('android smoke tests', () => {
  let driver: Browser

  beforeAll(async () => {
    driver = await remote(await getWebDriverConfig('android'))
  }, 60000)

  afterAll(async () => {
    await driver?.deleteSession()
  }, 60000)

  it('app launches successfully', sharedTestOptions, async () => {
    const appElement = await driver.$('//*[@content-desc]')
    await appElement.waitForDisplayed({ timeout: 20000 })
    expect(await appElement.isDisplayed()).toBe(true)
  })
})
```

### 1.6 add package.json scripts

```json
{
  "scripts": {
    "test:ios": "vitest run --config vitest.config.ios.mts",
    "test:android": "vitest run --config vitest.config.android.mts",
    "test:ios:watch": "vitest watch --config vitest.config.ios.mts",
    "test:android:watch": "vitest watch --config vitest.config.android.mts"
  }
}
```

## phase 2: ios ci/cd with warp runners (week 1-2)

### 2.1 adapt chat's build workflow

create `.github/workflows/build-ios-app.yml` (based on chat):

```yaml
name: build ios app

on:
  workflow_call:
    inputs:
      configuration:
        required: true
        type: string
        description: 'Debug or Release'
      destination:
        required: false
        type: string
        default: 'iOS-Simulator'
        description: 'iOS-Simulator or iOS'
      type:
        required: false
        type: string
        default: 'build'
        description: 'build or archive'
    outputs:
      built-app-cache-key:
        value: ${{ jobs.build.outputs.cache-key }}
      built-app-path:
        value: ${{ jobs.build.outputs.app-path }}

env:
  app_project_path: ./
  ios_app_name: App  # your app name
  app_id: ios-rn-app

jobs:
  build:
    runs-on: [macOS, sequoia-xcode-beta]  # warp runner
    timeout-minutes: 60
    outputs:
      cache-key: ${{ steps.cache-key.outputs.key }}
      app-path: ${{ steps.output-path.outputs.path }}

    steps:
      - name: checkout
        uses: actions/checkout@v4

      - name: select xcode version
        run: |
          if [ -f .xcode-version ]; then
            xcodes select "$(cat .xcode-version)"
          fi
          xcodebuild -version

      - name: install dependencies
        uses: ./.github/actions/install

      - name: write public env
        run: echo "PUBLIC_ENV=production" > .env

      - name: prebuild ios
        run: bun run prebuild:native --platform ios --no-install

      - name: pod install
        working-directory: ios
        run: pod install

      - name: build ios app
        id: build
        run: |
          set -eo pipefail

          SCHEME="${{ env.ios_app_name }}"
          WORKSPACE="ios/${{ env.ios_app_name }}.xcworkspace"
          CONFIGURATION="${{ inputs.configuration }}"

          if [ "${{ inputs.destination }}" = "iOS-Simulator" ]; then
            SDK="iphonesimulator"
            DESTINATION="generic/platform=iOS Simulator"
          else
            SDK="iphoneos"
            DESTINATION="generic/platform=iOS"
          fi

          if [ "${{ inputs.type }}" = "archive" ]; then
            ARCHIVE_PATH="ios/build/$SCHEME.xcarchive"
            xcrun xcodebuild \
              -scheme "$SCHEME" \
              -workspace "$WORKSPACE" \
              -configuration "$CONFIGURATION" \
              -sdk "$SDK" \
              -destination "$DESTINATION" \
              -archivePath "$ARCHIVE_PATH" \
              CODE_SIGNING_ALLOWED=NO \
              archive | tee xcodebuild.log | xcpretty

            echo "app-path=$ARCHIVE_PATH" >> $GITHUB_OUTPUT
          else
            DERIVED_DATA="ios/build"
            xcrun xcodebuild \
              -scheme "$SCHEME" \
              -workspace "$WORKSPACE" \
              -configuration "$CONFIGURATION" \
              -sdk "$SDK" \
              -destination "$DESTINATION" \
              -derivedDataPath "$DERIVED_DATA" \
              CODE_SIGNING_ALLOWED=NO \
              build | tee xcodebuild.log | xcpretty

            APP_PATH="$DERIVED_DATA/Build/Products/$CONFIGURATION-iphonesimulator/${{ env.ios_app_name }}.app"
            echo "app-path=$APP_PATH" >> $GITHUB_OUTPUT
          fi

      - name: generate cache key
        id: cache-key
        run: |
          HASH=$(echo "${{ github.sha }}-${{ inputs.configuration }}-${{ inputs.destination }}" | shasum | cut -d' ' -f1)
          echo "key=ios-build-$HASH" >> $GITHUB_OUTPUT

      - name: cache built app
        uses: actions/cache/save@v4
        with:
          path: ${{ steps.build.outputs.app-path }}
          key: ${{ steps.cache-key.outputs.key }}

      - name: upload build logs
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ios-build-logs-${{ inputs.configuration }}
          path: xcodebuild.log
```

### 2.2 create cached build workflow

create `.github/workflows/build-ios-app-cached.yml` (based on chat pattern):

```yaml
name: build ios app (cached)

on:
  workflow_call:
    inputs:
      configuration:
        required: true
        type: string
      destination:
        required: false
        type: string
        default: 'iOS-Simulator'
      type:
        required: false
        type: string
        default: 'build'
    outputs:
      output-cache-key:
        value: ${{ jobs.build-ios-js.outputs.output-cache-key }}
      built-app-path:
        value: ${{ jobs.build-ios-native.outputs.built-app-path }}

jobs:
  calculate-cache-key:
    runs-on: ubuntu-latest
    outputs:
      cache-key: ${{ steps.calc.outputs.key }}
    steps:
      - uses: actions/checkout@v4

      - name: calculate native hash
        id: calc
        run: |
          FILES=".xcode-version bun.lock app.config.ts"
          HASH=$(cat $FILES | sha1sum | awk '{print $1}')
          KEY="ios-native-${{ inputs.configuration }}-${{ inputs.destination }}-$HASH"
          echo "key=$KEY" >> $GITHUB_OUTPUT

  build-ios-native:
    needs: calculate-cache-key
    uses: ./.github/workflows/build-ios-app.yml
    with:
      configuration: ${{ inputs.configuration }}
      destination: ${{ inputs.destination }}
      type: ${{ inputs.type }}

  build-ios-js:
    needs: [calculate-cache-key, build-ios-native]
    runs-on: [macOS, sequoia-xcode-beta]
    outputs:
      output-cache-key: ${{ steps.final-cache.outputs.key }}
    steps:
      - uses: actions/checkout@v4

      - name: restore native build
        uses: actions/cache/restore@v4
        with:
          path: ${{ needs.build-ios-native.outputs.built-app-path }}
          key: ${{ needs.build-ios-native.outputs.built-app-cache-key }}
          fail-on-cache-miss: true

      - name: install dependencies
        uses: ./.github/actions/install

      - name: build js bundle
        run: |
          # build js bundle and inject into app
          bun run build:js

      - name: cache final build
        id: final-cache
        uses: actions/cache/save@v4
        with:
          path: ${{ needs.build-ios-native.outputs.built-app-path }}
          key: ios-final-${{ github.sha }}
```

### 2.3 create test workflow

create `.github/workflows/test-native-ios.yml`:

```yaml
name: ios native tests

env:
  simulator_ios_version: '18'
  simulator_device_name: 'iPhone 16 Pro'

on:
  pull_request:
  push:
    branches: [main]

jobs:
  build-ios-app-debug:
    uses: ./.github/workflows/build-ios-app-cached.yml
    with:
      configuration: Debug
      destination: iOS-Simulator
      type: build

  test-ios-native:
    needs: build-ios-app-debug
    runs-on: [macOS, sequoia-xcode-beta]
    timeout-minutes: 30
    steps:
      - name: checkout
        uses: actions/checkout@v4

      - name: install dependencies
        uses: ./.github/actions/install

      - name: download built app
        uses: actions/cache/restore@v4
        with:
          fail-on-cache-miss: true
          key: ${{ needs.build-ios-app-debug.outputs.output-cache-key }}
          path: ${{ needs.build-ios-app-debug.outputs.built-app-path }}

      - name: install appium
        uses: ./.github/actions/install-appium

      - name: boot simulator
        run: |
          UDID=$(xcrun simctl list devices available --json | \
            jq -r ".devices | to_entries[] | select(.key | contains(\"iOS-${{ env.simulator_ios_version }}\")) | .value[] | select(.name==\"${{ env.simulator_device_name }}\") | .udid" | head -1)

          if [ -z "$UDID" ]; then
            echo "simulator not found"
            exit 1
          fi

          xcrun simctl boot "$UDID" || true
          xcrun simctl list devices | grep Booted

      - name: install app on simulator
        run: |
          UDID=$(xcrun simctl list devices booted --json | jq -r '.devices | to_entries[].value[0].udid')
          xcrun simctl install "$UDID" "${{ needs.build-ios-app-debug.outputs.built-app-path }}"

      - name: run appium tests
        run: bun run test:ios

      - name: upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ios-test-results
          path: |
            test-results/
            screenshots/
```

### 2.4 create install action

create `.github/actions/install/action.yml` (based on chat):

```yaml
name: install dependencies
description: install node, bun, and project dependencies

runs:
  using: composite
  steps:
    - name: setup node
      uses: actions/setup-node@v4
      with:
        node-version: 24.x

    - name: install bun
      uses: oven-sh/setup-bun@v2
      with:
        bun-version-file: .bun-version

    - name: create empty env
      shell: bash
      run: touch .env

    - name: install dependencies
      shell: bash
      run: bun install

    - name: bootstrap
      shell: bash
      run: bun bootstrap
```

## phase 3: android support (week 2-3)

### 3.1 android build workflow

create `.github/workflows/build-android-app.yml`:

```yaml
name: build android app

on:
  workflow_call:
    inputs:
      variant:
        required: true
        type: string
        description: 'debug or release'
    outputs:
      built-apk-path:
        value: ${{ jobs.build.outputs.apk-path }}
      built-apk-cache-key:
        value: ${{ jobs.build.outputs.cache-key }}

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    outputs:
      apk-path: ${{ steps.build.outputs.path }}
      cache-key: ${{ steps.cache-key.outputs.key }}

    steps:
      - uses: actions/checkout@v4

      - name: setup java
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: install dependencies
        uses: ./.github/actions/install

      - name: prebuild android
        run: bun run prebuild:native --platform android --no-install

      - name: build apk
        working-directory: android
        run: |
          if [ "${{ inputs.variant }}" = "release" ]; then
            ./gradlew assembleRelease
            echo "path=android/app/build/outputs/apk/release/app-release.apk" >> $GITHUB_OUTPUT
          else
            ./gradlew assembleDebug
            echo "path=android/app/build/outputs/apk/debug/app-debug.apk" >> $GITHUB_OUTPUT
          fi
        id: build

      - name: generate cache key
        id: cache-key
        run: |
          HASH=$(echo "${{ github.sha }}-${{ inputs.variant }}" | shasum | cut -d' ' -f1)
          echo "key=android-build-$HASH" >> $GITHUB_OUTPUT

      - name: cache built apk
        uses: actions/cache/save@v4
        with:
          path: ${{ steps.build.outputs.path }}
          key: ${{ steps.cache-key.outputs.key }}
```

### 3.2 android test workflow

create `.github/workflows/test-native-android.yml`:

```yaml
name: android native tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  build-android-app-debug:
    uses: ./.github/workflows/build-android-app.yml
    with:
      variant: debug

  test-android-native:
    needs: build-android-app-debug
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4

      - name: install dependencies
        uses: ./.github/actions/install

      - name: download built apk
        uses: actions/cache/restore@v4
        with:
          fail-on-cache-miss: true
          key: ${{ needs.build-android-app-debug.outputs.built-apk-cache-key }}
          path: ${{ needs.build-android-app-debug.outputs.built-apk-path }}

      - name: enable kvm
        run: |
          echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
          sudo udevadm control --reload-rules
          sudo udevadm trigger --name-match=kvm

      - name: install appium
        uses: ./.github/actions/install-appium

      - name: avd cache
        uses: actions/cache@v4
        id: avd-cache
        with:
          path: |
            ~/.android/avd/*
            ~/.android/adb*
          key: avd-34

      - name: create avd and generate snapshot
        if: steps.avd-cache.outputs.cache-hit != 'true'
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          arch: x86_64
          force-avd-creation: false
          emulator-options: -no-window -gpu swiftshader_indirect -noaudio -no-boot-anim -camera-back none
          disable-animations: false
          script: echo "generated avd snapshot"

      - name: run tests
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          arch: x86_64
          force-avd-creation: false
          emulator-options: -no-snapshot-save -no-window -gpu swiftshader_indirect -noaudio -no-boot-anim -camera-back none
          disable-animations: true
          script: bun run test:android

      - name: upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: android-test-results
          path: |
            test-results/
            screenshots/
```

## phase 4: takeout cli scripts (week 3)

### 4.1 create mobile scripts

create `scripts/mobile/build-ios.ts`:

```typescript
#!/usr/bin/env bun

/**
 * build ios app locally
 *
 * usage:
 *   bun tko mobile/build-ios
 *   bun tko mobile/build-ios --release
 */

import { execSync } from 'node:child_process'

const isRelease = process.argv.includes('--release')
const configuration = isRelease ? 'Release' : 'Debug'

console.info(`building ios app (${configuration})...`)

// prebuild
console.info('running prebuild...')
execSync('bun run prebuild:native --platform ios --no-install', {
  stdio: 'inherit',
})

// pod install
console.info('installing pods...')
execSync('pod install', { cwd: 'ios', stdio: 'inherit' })

// build
console.info('building with xcode...')
execSync(
  `xcrun xcodebuild \
    -scheme App \
    -workspace ios/App.xcworkspace \
    -configuration ${configuration} \
    -sdk iphonesimulator \
    -destination "generic/platform=iOS Simulator" \
    -derivedDataPath ios/build \
    build | xcpretty`,
  { stdio: 'inherit' },
)

console.info('✓ ios build complete')
console.info(
  `app: ios/build/Build/Products/${configuration}-iphonesimulator/App.app`,
)
```

create `scripts/mobile/test-ios.ts`:

```typescript
#!/usr/bin/env bun

/**
 * run ios appium tests
 *
 * usage:
 *   bun tko mobile/test-ios
 *   bun tko mobile/test-ios --watch
 */

import { execSync } from 'node:child_process'

const isWatch = process.argv.includes('--watch')
const command = isWatch ? 'test:ios:watch' : 'test:ios'

console.info('running ios tests...')

execSync(`bun run ${command}`, { stdio: 'inherit' })
```

create `scripts/mobile/test-android.ts`:

```typescript
#!/usr/bin/env bun

/**
 * run android appium tests
 *
 * usage:
 *   bun tko mobile/test-android
 *   bun tko mobile/test-android --watch
 */

import { execSync } from 'node:child_process'

const isWatch = process.argv.includes('--watch')
const command = isWatch ? 'test:android:watch' : 'test:android'

console.info('running android tests...')

execSync(`bun run ${command}`, { stdio: 'inherit' })
```

create `scripts/mobile/setup.ts`:

```typescript
#!/usr/bin/env bun

/**
 * setup mobile development environment
 *
 * usage:
 *   bun tko mobile/setup
 */

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

console.info('setting up mobile development environment...')

// check for xcode (macos only)
if (process.platform === 'darwin') {
  console.info('checking xcode...')
  try {
    execSync('xcodebuild -version', { stdio: 'inherit' })
  } catch {
    console.error('xcode not found. install from app store.')
    process.exit(1)
  }

  // install cocoapods
  console.info('checking cocoapods...')
  try {
    execSync('pod --version', { stdio: 'inherit' })
  } catch {
    console.info('installing cocoapods...')
    execSync('sudo gem install cocoapods', { stdio: 'inherit' })
  }
}

// install appium
console.info('installing appium...')
execSync('npm install -g appium@next', { stdio: 'inherit' })
execSync('appium driver install xcuitest', { stdio: 'inherit' })
execSync('appium driver install uiautomator2', { stdio: 'inherit' })

// verify installation
console.info('verifying installation...')
execSync('appium --version', { stdio: 'inherit' })
execSync('appium driver list --installed', { stdio: 'inherit' })

console.info('✓ mobile setup complete')
console.info('\nnext steps:')
console.info('  bun tko mobile/build-ios    # build ios app')
console.info('  bun tko mobile/test-ios     # run ios tests')
console.info('  bun tko mobile/build-android # build android app')
console.info('  bun tko mobile/test-android  # run android tests')
```

## phase 5: advanced features (week 4-5)

### 5.1 test recording and debugging

add screenshot capture to helpers:

```typescript
// testing-utils/mobile/helpers.ts
export async function captureScreenshot(
  driver: Browser,
  name: string,
) {
  const screenshot = await driver.saveScreenshot(
    `./screenshots/${name}-${Date.now()}.png`,
  )
  console.info(`screenshot saved: ${name}`)
  return screenshot
}

export async function captureOnFailure(
  driver: Browser,
  testName: string,
  fn: () => Promise<void>,
) {
  try {
    await fn()
  } catch (error) {
    await captureScreenshot(driver, `failure-${testName}`)
    throw error
  }
}
```

### 5.2 test reporting

add test reporter configuration:

```typescript
// vitest.config.ios.mts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // ... existing config
    reporters: ['default', 'html', 'junit'],
    outputFile: {
      html: './test-results/index.html',
      junit: './test-results/junit.xml',
    },
  },
})
```

update workflows to upload reports:

```yaml
- name: upload test results
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: ios-test-results
    path: |
      test-results/
      screenshots/

- name: publish test results
  if: always()
  uses: dorny/test-reporter@v1
  with:
    name: ios test results
    path: test-results/junit.xml
    reporter: java-junit
```

## implementation checklist

### week 1: foundation
- [ ] copy chat's `.github/actions/install/action.yml`
- [ ] create `.github/actions/install-appium/action.yml`
- [ ] add appium dependencies to package.json
- [ ] create `testing-utils/mobile/` directory structure
- [ ] implement `getWebDriverConfig.ts`
- [ ] implement `helpers.ts`
- [ ] create `vitest.config.ios.mts`
- [ ] create `global-setup.ts`
- [ ] write first smoke test
- [ ] verify local test execution works

### week 2: ios ci/cd
- [ ] copy and adapt `build-ios-app.yml` from chat
- [ ] create `build-ios-app-cached.yml`
- [ ] create `test-native-ios.yml`
- [ ] add `.xcode-version` file
- [ ] configure warp runners in github
- [ ] test ios build workflow
- [ ] test ios test workflow
- [ ] verify caching works

### week 3: android + scripts
- [ ] create `build-android-app.yml`
- [ ] create `test-native-android.yml`
- [ ] create `vitest.config.android.mts`
- [ ] write android smoke tests
- [ ] create `scripts/mobile/setup.ts`
- [ ] create `scripts/mobile/build-ios.ts`
- [ ] create `scripts/mobile/build-android.ts`
- [ ] create `scripts/mobile/test-ios.ts`
- [ ] create `scripts/mobile/test-android.ts`
- [ ] verify all scripts work locally

### week 4: polish
- [ ] add screenshot capture
- [ ] add test reporting
- [ ] optimize build caching
- [ ] add health checks
- [ ] create troubleshooting guide
- [ ] document test writing patterns
- [ ] run `bun lint:fix && bun tko check types`

## testing strategy

### test pyramid
1. **unit tests (70%)** - already in place with vitest
2. **integration tests (20%)** - already in place with playwright
3. **e2e mobile tests (10%)** - new appium tests

### test coverage targets
- smoke tests: critical paths (login, navigation, core features)
- regression tests: common bug areas
- platform-specific tests: ios/android differences
- offline tests: zero sync behavior

### test execution
- **local development**: `bun tko mobile/test-ios --watch`
- **ci on prs**: smoke tests only (< 5 min)
- **ci on main**: full regression suite (< 15 min)
- **nightly**: extended test suite with multiple devices

## performance targets

### build times
- ios debug build: < 10 minutes
- android debug build: < 5 minutes
- cached rebuild: < 2 minutes

### test times
- ios smoke tests: < 3 minutes
- android smoke tests: < 3 minutes
- full regression: < 15 minutes

### ci/cd pipeline
- total pr pipeline: < 20 minutes
- build + test parallelization
- smart caching to avoid rebuilds

## success metrics

### short term (1 month)
- 10+ appium test cases covering critical paths
- 95% build success rate
- < 20 minute pr feedback time
- zero manual native testing for smoke tests

### medium term (3 months)
- 30+ comprehensive test cases
- ios + android parity in test coverage
- automated nightly regression runs
- 50% reduction in native bugs reaching production

### long term (6 months)
- 50+ test suite covering all major features
- < 2% test flakiness rate
- full platform matrix coverage (multiple ios/android versions)
- 80% reduction in manual qa time

## cost analysis

### warp runners
- macos runner: ~$0.08/minute
- estimated usage: 100 hours/month
- monthly cost: ~$480

### github actions
- ubuntu runners: included in plan
- storage: minimal (caching)

### total estimated cost
- **monthly**: ~$480 for warp runners
- **roi**: 15+ hours/week saved in manual testing = break even in 3 weeks

## appendix: complete file references

### chat repository workflows
```
/Users/n8/chat/.github/workflows/
├── build-ios-app.yml              # core ios build (COPY THIS)
├── build-ios-app-cached.yml       # cached build pattern (COPY THIS)
├── ios-cd.yml                     # testflight deployment (REFERENCE)
├── test-native-ios.yml            # test template (ADAPT THIS)
└── ci.yml                         # main ci (REFERENCE)
```

### chat repository actions
```
/Users/n8/chat/.github/actions/
├── install/action.yml             # dependency setup (COPY THIS)
└── install-maestro/action.yml     # adapt for appium
```

### chat repository configs
```
/Users/n8/chat/
├── app.config.ts                  # expo config (REFERENCE)
├── ios/Podfile                    # ios dependencies (REFERENCE)
├── .xcode-version                 # xcode version (COPY THIS)
└── .bun-version                   # bun version (COPY THIS)
```

### tamagui repository tests
```
/Users/n8/tamagui/code/kitchen-sink/
├── vitest.config.ios.mts          # test config (ADAPT THIS)
├── testing-utils/
│   ├── getWebDriverConfig.ts      # device config (ADAPT THIS)
│   └── global-setup.ts            # test setup (ADAPT THIS)
└── tests/
    └── sample.test.ios.tsx        # example test (REFERENCE)
```

### key configurations from chat

**warp runner specification:**
```yaml
runs-on: [macOS, sequoia-xcode-beta]
```

**xcode version:**
```
26.0 Beta 6
```

**expo config highlights:**
```typescript
{
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'chat.start.dev1',
    deploymentTarget: '17.0',
    useFrameworks: 'static',
  }
}
```

**build command pattern:**
```bash
xcrun xcodebuild \
  -scheme 'Start' \
  -workspace 'ios/Start.xcworkspace' \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "generic/platform=iOS Simulator" \
  -derivedDataPath ios/build \
  CODE_SIGNING_ALLOWED=NO \
  build | xcpretty
```

**caching strategy:**
```yaml
# calculate hash from key files
HASH=$(cat .xcode-version bun.lock app.config.ts | sha1sum | awk '{print $1}')
KEY="ios-native-$CONFIGURATION-$HASH"

# cache native build
- uses: actions/cache/save@v4
  with:
    path: ios/build
    key: ${{ env.KEY }}
```

### appium configuration from tamagui

**webdriver config pattern:**
```typescript
{
  platformName: 'iOS',
  'appium:options': {
    automationName: 'XCUITest',
    udid: getSimulatorUdid(), // auto-detect
    app: 'ios/build/.../App.app',
    platformVersion: '18.0',
    deviceName: 'iPhone 16 Pro',
  },
  hostname: 'localhost',
  port: 4723,
  connectionRetryTimeout: 300000,
}
```

**simulator detection:**
```typescript
function getSimulatorUdid(): string {
  const output = execSync('xcrun simctl list devices available --json').toString()
  const devices = JSON.parse(output)

  for (const runtime of Object.keys(devices.devices)) {
    if (!runtime.includes('iOS-18')) continue
    const iosDevices = devices.devices[runtime]
    const device = iosDevices.find(d => d.name.includes('iPhone 16 Pro'))

    if (device) {
      if (device.state !== 'Booted') {
        execSync(`xcrun simctl boot ${device.udid}`)
      }
      return device.udid
    }
  }

  throw new Error('Simulator not found')
}
```

**test pattern:**
```typescript
import { remote } from 'webdriverio'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('ios tests', () => {
  let driver: Browser

  beforeAll(async () => {
    driver = await remote(await getWebDriverConfig('ios'))
  }, 60000)

  afterAll(async () => {
    await driver?.deleteSession()
  }, 60000)

  it('launches app', { timeout: 60000 }, async () => {
    const element = await driver.$('//*[@label]')
    await element.waitForDisplayed({ timeout: 20000 })
    expect(await element.isDisplayed()).toBe(true)
  })
})
```

## phase 6: continuous deployment (cd) to testflight (week 5)

### 6.1 testflight deployment workflow

create `.github/workflows/ios-cd.yml` (based on chat production cd):

```yaml
name: ios cd (testflight)

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, reopened, synchronize, ready_for_review]

jobs:
  archive-ios-app:
    if: |
      github.event.pull_request.draft != true &&
      contains(github.event.commits[0].message, 'native:')
    uses: ./.github/workflows/build-ios-app-cached.yml
    secrets: inherit
    permissions:
      contents: read
      pull-requests: read
    with:
      configuration: Release
      destination: iOS
      type: archive

  generate-changelog:
    if: |
      github.event.pull_request.draft != true &&
      contains(github.event.commits[0].message, 'native:')
    runs-on: ubuntu-latest
    timeout-minutes: 10
    outputs:
      changelog: ${{ steps.generate.outputs.changelog }}
    steps:
      - uses: actions/checkout@v4

      - name: generate changelog
        id: generate
        uses: ./.github/actions/generate-changelog

  sign-and-upload:
    needs: [archive-ios-app, generate-changelog]
    runs-on: [macOS, sequoia-xcode-beta]
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4

      - name: download built archive
        uses: actions/download-artifact@v5.0.0
        with:
          name: ${{ needs.archive-ios-app.outputs.built-app-artifact-name }}

      - name: get app info
        id: app-info
        run: |
          APP_PATH="${{ needs.archive-ios-app.outputs.built-app-path }}"
          BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print :ApplicationProperties:CFBundleIdentifier" "$APP_PATH/Info.plist")
          VERSION=$(/usr/libexec/PlistBuddy -c "Print :ApplicationProperties:CFBundleShortVersionString" "$APP_PATH/Info.plist")

          echo "bundle-id=$BUNDLE_ID" >> $GITHUB_OUTPUT
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "app-path=$APP_PATH" >> $GITHUB_OUTPUT

      - name: install fastlane
        run: |
          if ! command -v fastlane &> /dev/null; then
            gem install fastlane --no-document
          fi
          fastlane --version

      - name: create temporary keychain
        id: keychain
        run: |
          keychain_name="temp-$(openssl rand -hex 6)"
          keychain_password="$(openssl rand -base64 24)"
          keychain_path="$HOME/Library/Keychains/$keychain_name-db"

          security create-keychain -p "$keychain_password" "$keychain_name"
          security set-keychain-settings -t 3600 -l "$keychain_name"

          original_keychains=$(security list-keychains -d user | sed 's/^[[:space:]]*"\(.*\)"/\1/')
          security list-keychains -d user -s "$keychain_path" $original_keychains

          echo "name=$keychain_name" >> $GITHUB_OUTPUT
          echo "password=$keychain_password" >> $GITHUB_OUTPUT
          echo "path=$keychain_path" >> $GITHUB_OUTPUT
          echo "original-keychains=$original_keychains" >> $GITHUB_OUTPUT

      - name: sync code signing identities
        env:
          APPLE_CODE_SIGNING_GIT_URL: ${{ secrets.APPLE_CODE_SIGNING_GIT_URL }}
          APPLE_CODE_SIGNING_GIT_SSH_KEY: ${{ secrets.APPLE_CODE_SIGNING_GIT_SSH_KEY }}
          APPLE_CODE_SIGNING_GIT_PASSPHRASE: ${{ secrets.APPLE_CODE_SIGNING_GIT_PASSPHRASE }}
          KEYCHAIN_NAME: ${{ steps.keychain.outputs.name }}
          KEYCHAIN_PASSWORD: ${{ steps.keychain.outputs.password }}
          APP_BUNDLE_ID: ${{ steps.app-info.outputs.bundle-id }}
        run: |
          MATCH_PASSWORD="$APPLE_CODE_SIGNING_GIT_PASSPHRASE" fastlane match run \
            --type appstore \
            --readonly \
            --skip_certificate_matching true \
            --git_url "$APPLE_CODE_SIGNING_GIT_URL" \
            --git_private_key "$APPLE_CODE_SIGNING_GIT_SSH_KEY" \
            --keychain_name "$KEYCHAIN_NAME" \
            --keychain_password "$KEYCHAIN_PASSWORD" \
            --output_path ./.apple-code-signing \
            --app_identifier "$APP_BUNDLE_ID"

          provisioning_profile_name=$(security cms -D -i .apple-code-signing/*.mobileprovision | plutil -extract Name raw -)
          team_id=$(security cms -D -i .apple-code-signing/*.mobileprovision | plutil -extract TeamIdentifier.0 raw -)

          echo "provisioning-profile-name=$provisioning_profile_name" >> $GITHUB_OUTPUT
          echo "team-id=$team_id" >> $GITHUB_OUTPUT

          security set-key-partition-list -S apple-tool:,apple: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

      - name: get app store connect credentials
        id: asc-creds
        env:
          APP_STORE_CONNECT_API_KEY_ISSUER_ID: ${{ secrets.APP_STORE_CONNECT_API_KEY_ISSUER_ID }}
          APP_STORE_CONNECT_API_KEY_ID: ${{ secrets.APP_STORE_CONNECT_API_KEY_ID }}
          APP_STORE_CONNECT_API_KEY_P8: ${{ secrets.APP_STORE_CONNECT_API_KEY_P8 }}
        run: |
          api_key="{ \"key_id\": \"$APP_STORE_CONNECT_API_KEY_ID\", \"issuer_id\": \"$APP_STORE_CONNECT_API_KEY_ISSUER_ID\", \"key\": $(echo "$APP_STORE_CONNECT_API_KEY_P8" | jq -Rs .) }"
          echo "api-key=$api_key" >> $GITHUB_OUTPUT

      - name: get build number
        id: build-number
        env:
          API_KEY: ${{ steps.asc-creds.outputs.api-key }}
          APP_BUNDLE_ID: ${{ steps.app-info.outputs.bundle-id }}
          APP_VERSION: ${{ steps.app-info.outputs.version }}
        run: |
          latest_build_number=$(fastlane run latest_testflight_build_number \
            app_identifier:"$APP_BUNDLE_ID" \
            version:"$APP_VERSION" \
            api_key:"$API_KEY" | grep "Result:" | awk '{print $2}')

          if [ -z "$latest_build_number" ]; then
            next_build_number=1
          else
            next_build_number=$(( 10#$latest_build_number + 2 ))
          fi

          echo "number=$next_build_number" >> $GITHUB_OUTPUT

      - name: prepare app for publishing
        env:
          BUILD_NUMBER: ${{ steps.build-number.outputs.number }}
          BUILT_ARCHIVE_PATH: ${{ steps.app-info.outputs.app-path }}
        run: |
          BUILT_APP_PATH="$BUILT_ARCHIVE_PATH/Products/Applications/*.app"
          /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" "$BUILT_APP_PATH/Info.plist"
          /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" "$BUILT_ARCHIVE_PATH/Info.plist"

      - name: code sign
        id: code-sign
        env:
          BUILT_ARCHIVE_PATH: ${{ steps.app-info.outputs.app-path }}
          TEAM_ID: ${{ steps.sync-certs.outputs.team-id }}
          PROVISIONING_PROFILE_NAME: ${{ steps.sync-certs.outputs.provisioning-profile-name }}
          APP_BUNDLE_ID: ${{ steps.app-info.outputs.bundle-id }}
          KEYCHAIN_NAME: ${{ steps.keychain.outputs.name }}
        run: |
          cat > ./.apple-code-signing/export.plist <<EOF
          <?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
          <plist version="1.0">
          <dict>
            <key>method</key>
            <string>app-store-connect</string>
            <key>signingStyle</key>
            <string>manual</string>
            <key>teamID</key>
            <string>$TEAM_ID</string>
            <key>provisioningProfiles</key>
            <dict>
              <key>$APP_BUNDLE_ID</key>
              <string>$PROVISIONING_PROFILE_NAME</string>
            </dict>
            <key>signingCertificate</key>
            <string>Apple Distribution</string>
            <key>uploadSymbols</key>
            <true/>
            <key>stripSwiftSymbols</key>
            <true/>
          </dict>
          </plist>
          EOF

          export OTHER_CODE_SIGN_FLAGS="--keychain $KEYCHAIN_NAME"

          xcodebuild -exportArchive \
            -archivePath "$BUILT_ARCHIVE_PATH" \
            -exportOptionsPlist ./.apple-code-signing/export.plist \
            -exportPath _export

          ipa_path="_export/*.ipa"
          echo "ipa-path=$ipa_path" >> $GITHUB_OUTPUT

      - name: upload to testflight
        env:
          API_KEY: ${{ steps.asc-creds.outputs.api-key }}
          IPA_PATH: ${{ steps.code-sign.outputs.ipa-path }}
          CHANGELOG: ${{ needs.generate-changelog.outputs.changelog }}
        run: |
          fastlane pilot upload --ipa "$IPA_PATH" \
            --api_key "$API_KEY" \
            --skip_submission true \
            --skip_waiting_for_build_processing true \
            --distribute_external false \
            --changelog "$CHANGELOG"

      - name: remove temporary keychain
        if: always()
        env:
          KEYCHAIN_NAME: ${{ steps.keychain.outputs.name }}
          KEYCHAIN_PATH: ${{ steps.keychain.outputs.path }}
          ORIGINAL_KEYCHAINS: ${{ steps.keychain.outputs.original-keychains }}
        run: |
          security list-keychains -d user -s $ORIGINAL_KEYCHAINS
          security delete-keychain "$KEYCHAIN_PATH" || true
```

### 6.2 changelog generation action

create `.github/actions/generate-changelog/action.yml`:

```yaml
name: generate changelog
description: generate changelog from github context

outputs:
  changelog:
    description: generated changelog text
    value: ${{ steps.generate.outputs.changelog }}

runs:
  using: composite
  steps:
    - name: generate changelog
      id: generate
      shell: bash
      run: |
        if [ "${{ github.event_name }}" = "pull_request" ]; then
          # get pr title and body
          pr_title="${{ github.event.pull_request.title }}"
          pr_body="${{ github.event.pull_request.body }}"

          # extract first paragraph as summary
          summary=$(echo "$pr_body" | head -n 3)

          # get commits in pr
          commits=$(gh pr view ${{ github.event.pull_request.number }} --json commits -q '.commits[] | "• \(.messageHeadline) (\(.abbreviatedOid))"')

          changelog="$pr_title\n\n$summary\n\nCommits:\n$commits"
        else
          # for push events, list recent commits
          commits=$(git log --pretty=format:"• %s (%h)" -n 5)
          changelog="Recent changes:\n$commits"
        fi

        # save to output
        echo "changelog<<EOF" >> $GITHUB_OUTPUT
        echo "$changelog" >> $GITHUB_OUTPUT
        echo "EOF" >> $GITHUB_OUTPUT
```

### 6.3 required secrets setup

add to github repository secrets:

```yaml
# code signing (fastlane match)
APPLE_CODE_SIGNING_GIT_URL: git@github.com:your-org/certificates.git
APPLE_CODE_SIGNING_GIT_SSH_KEY: |
  -----BEGIN OPENSSH PRIVATE KEY-----
  ...
  -----END OPENSSH PRIVATE KEY-----
APPLE_CODE_SIGNING_GIT_PASSPHRASE: your-encryption-passphrase

# app store connect api
APP_STORE_CONNECT_API_KEY_ISSUER_ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APP_STORE_CONNECT_API_KEY_ID: XXXXXXXXXX
APP_STORE_CONNECT_API_KEY_P8: |
  -----BEGIN PRIVATE KEY-----
  ...
  -----END PRIVATE KEY-----
```

### 6.4 fastlane match setup

initialize fastlane match (one-time setup):

```bash
# install fastlane
gem install fastlane

# initialize match
fastlane match init

# choose git storage
# enter your private git repo url

# generate certificates
fastlane match appstore -a com.yourapp.bundle.id

# this will:
# 1. create certificates and provisioning profiles
# 2. encrypt them with a passphrase
# 3. store in private git repo
```

### 6.5 cd triggers and conditions

**commit message pattern:**
```bash
git commit -m "native: update app icon and splash screen"
# triggers cd pipeline

git commit -m "web: fix button styling"
# skips cd pipeline

git commit -m "docs: update readme"
# skips cd pipeline
```

**pr-based deployment:**
- opens pr → builds and tests
- ready for review → uploads to testflight (internal)
- merges to main → uploads to testflight (external beta)

### 6.6 build number management

**auto-increment strategy:**
1. query testflight for latest build number
2. increment by 2 (allows manual builds in between)
3. update both app and archive info.plist
4. ensures no collisions

**example:**
```
latest testflight build: 42
next ci build: 44
manual emergency build: 43
next ci build after: 46
```

## phase 7: hot updates (ota) - optional (week 6)

### 7.1 hot updater setup

install and configure hot updater (based on fleek pattern):

```bash
bun add @hot-updater/react-native @hot-updater/cli
```

create `hot-updater.config.ts`:

```typescript
import { defineConfig } from '@hot-updater/cli'
import { bare } from '@hot-updater/build'
import { supabaseStorage, supabaseDatabase } from '@hot-updater/storage-supabase'

export default defineConfig({
  build: bare({ enableHermes: true }),
  storage: supabaseStorage({
    supabaseUrl: process.env.HOT_UPDATER_SUPABASE_URL!,
    supabaseAnonKey: process.env.HOT_UPDATER_SUPABASE_SERVICE_KEY!,
    bucketName: process.env.HOT_UPDATER_SUPABASE_BUCKET_NAME!,
  }),
  database: supabaseDatabase({
    supabaseUrl: process.env.HOT_UPDATER_SUPABASE_URL!,
    supabaseAnonKey: process.env.HOT_UPDATER_SUPABASE_SERVICE_KEY!,
  }),
  updateStrategy: 'appVersion',
})
```

update `app.config.ts`:

```typescript
{
  expo: {
    version: '1.0.0',
    runtimeVersion: '1.0.0', // matches version for appVersion strategy
    plugins: [
      ['@hot-updater/react-native', {
        channel: process.env.APP_VARIANT || 'production'
      }]
    ]
  }
}
```

### 7.2 ota deployment workflow

create `scripts/mobile/deploy-hot-update.ts`:

```typescript
#!/usr/bin/env bun

/**
 * deploy hot update (ota)
 *
 * usage:
 *   bun tko mobile/deploy-hot-update --platform ios --channel production
 *   bun tko mobile/deploy-hot-update --platform android --channel preview
 */

import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const platform = args.find(arg => arg.includes('--platform'))?.split('=')[1] || 'ios'
const channel = args.find(arg => arg.includes('--channel'))?.split('=')[1] || 'production-pre'

const appVersion = require('../../app.config.ts').expo.version

console.info(`deploying hot update...`)
console.info(`  platform: ${platform}`)
console.info(`  channel: ${channel}`)
console.info(`  app version: ${appVersion}`)

const cmd = `METRO_RESET_CACHE=true bun hot-updater deploy \
  --platform ${platform} \
  --channel ${channel} \
  --target-app-version "${appVersion}"`

execSync(cmd, { stdio: 'inherit' })

console.info(`\n✓ hot update deployed to ${channel} channel`)

if (channel === 'production-pre') {
  console.info('\nnext steps:')
  console.info('  1. test update on production app')
  console.info('  2. bun hot-updater console')
  console.info('  3. promote production-pre → production')
}
```

### 7.3 ota deployment process

**safe deployment pattern:**

1. **deploy to pre-release channel:**
   ```bash
   bun tko mobile/deploy-hot-update --platform ios --channel production-pre
   ```

2. **test on production app:**
   - download production app from app store
   - open developer menu (tap logo 20 times)
   - check for pre-update
   - update and test thoroughly

3. **promote to production:**
   ```bash
   bun hot-updater console
   # open http://localhost:1422
   # select production-pre channel
   # click "promote to production"
   ```

4. **monitor rollout:**
   - check update adoption rate
   - monitor crash reports
   - rollback if needed

### 7.4 when to use hot updates

**✓ use hot updates for:**
- bug fixes (js-only)
- ui tweaks
- content updates
- feature toggles
- a/b test changes

**✗ do not use hot updates for:**
- native code changes
- new native dependencies
- expo sdk upgrades
- breaking changes
- security updates (use full build)

### 7.5 required secrets for ota

add to github secrets:

```yaml
HOT_UPDATER_SUPABASE_URL: https://xxx.supabase.co
HOT_UPDATER_SUPABASE_SERVICE_KEY: eyJxxx... (service role key, not anon key)
HOT_UPDATER_SUPABASE_BUCKET_NAME: hot-updates
```

## implementation checklist (updated)

### week 1: foundation
- [ ] copy chat's `.github/actions/install/action.yml`
- [ ] create `.github/actions/install-appium/action.yml`
- [ ] add appium dependencies to package.json
- [ ] create `testing-utils/mobile/` directory structure
- [ ] implement `getWebDriverConfig.ts`
- [ ] implement `helpers.ts`
- [ ] create `vitest.config.ios.mts`
- [ ] create `global-setup.ts`
- [ ] write first smoke test
- [ ] verify local test execution works

### week 2: ios ci/cd
- [ ] copy and adapt `build-ios-app.yml` from chat
- [ ] create `build-ios-app-cached.yml`
- [ ] create `test-native-ios.yml`
- [ ] add `.xcode-version` file
- [ ] configure warp runners in github
- [ ] test ios build workflow
- [ ] test ios test workflow
- [ ] verify caching works

### week 3: android + scripts
- [ ] create `build-android-app.yml`
- [ ] create `test-native-android.yml`
- [ ] create `vitest.config.android.mts`
- [ ] write android smoke tests
- [ ] create `scripts/mobile/setup.ts`
- [ ] create `scripts/mobile/build-ios.ts`
- [ ] create `scripts/mobile/build-android.ts`
- [ ] create `scripts/mobile/test-ios.ts`
- [ ] create `scripts/mobile/test-android.ts`
- [ ] verify all scripts work locally

### week 4: polish
- [ ] add screenshot capture
- [ ] add test reporting
- [ ] optimize build caching
- [ ] add health checks
- [ ] create troubleshooting guide
- [ ] document test writing patterns
- [ ] run `bun lint:fix && bun tko check types`

### week 5: cd to testflight
- [ ] setup private git repo for certificates
- [ ] initialize fastlane match
- [ ] add app store connect api key
- [ ] create `ios-cd.yml` workflow
- [ ] create `generate-changelog` action
- [ ] test cd pipeline on pr
- [ ] verify testflight upload works
- [ ] document cd process

### week 6: hot updates (optional)
- [ ] setup supabase project for ota
- [ ] install hot-updater packages
- [ ] create `hot-updater.config.ts`
- [ ] update `app.config.ts` with plugin
- [ ] create deploy script
- [ ] test ota deployment
- [ ] document ota process

## cd deployment flow

```mermaid
graph TB
    A[Commit with 'native:'] --> B[Build iOS Archive]
    A --> C[Generate Changelog]
    B --> D[Run Tests]
    C --> E[Sign & Upload Job]
    D --> E
    E --> F[Download Archive]
    F --> G[Create Temp Keychain]
    G --> H[Fastlane Match]
    H --> I[Get Build Number]
    I --> J[Update Plists]
    J --> K[Code Sign]
    K --> L[Upload to TestFlight]
    L --> M[Cleanup Keychain]
```

## secrets reference

### required for ci/cd
```yaml
# code signing
APPLE_CODE_SIGNING_GIT_URL
APPLE_CODE_SIGNING_GIT_SSH_KEY
APPLE_CODE_SIGNING_GIT_PASSPHRASE

# app store connect
APP_STORE_CONNECT_API_KEY_ISSUER_ID
APP_STORE_CONNECT_API_KEY_ID
APP_STORE_CONNECT_API_KEY_P8
```

### optional for hot updates
```yaml
HOT_UPDATER_SUPABASE_URL
HOT_UPDATER_SUPABASE_SERVICE_KEY
HOT_UPDATER_SUPABASE_BUCKET_NAME
```

## cd file references

### chat repository cd files
```
/Users/n8/chat/.github/workflows/
├── ios-cd.yml                             # COMPLETE CD PIPELINE (COPY THIS)
├── build-ios-app-cached.yml               # cached build (COPY THIS)
└── build-ios-app.yml                      # base build (COPY THIS)

/Users/n8/chat/.github/actions/
├── install/action.yml                     # dependency setup (COPY THIS)
└── generate-changelog/                    # changelog generation (COPY THIS)
    ├── action.yml
    └── generate-changelog-from-github-context.cjs
```

### fleek repository references
```
/Users/n8/fleek/
├── hot-updater.config.ts                  # ota config (REFERENCE)
├── app.config.ts                          # expo config with ota (REFERENCE)
├── eas.json                               # eas build profiles (REFERENCE)
└── docs/ota-hot-update.md                 # ota guide (REFERENCE)
```

## next steps

1. **review this plan** with team
2. **setup warp runners** - register and configure
3. **week 1 implementation** - appium infrastructure
4. **week 2 implementation** - ios ci/cd
5. **week 3 implementation** - android + scripts
6. **week 4 polish** - reporting and optimization
7. **week 5 implementation** - cd to testflight
8. **week 6 optional** - hot updates

---

**document version**: 3.0
**last updated**: 2025-11-07
**status**: ready for implementation
**based on**: ~/chat production ci/cd + ~/tamagui appium testing + ~/fleek ota updates
