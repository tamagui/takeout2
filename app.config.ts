import type { ExpoConfig } from 'expo/config'

const appName = 'Fleek'
const appId = appName.toLowerCase()

const { APP_VARIANT = 'development' } = process.env

if (
  APP_VARIANT !== 'production' &&
  APP_VARIANT !== 'preview' &&
  APP_VARIANT !== 'development'
) {
  throw new Error(`Invalid APP_VARIANT: ${APP_VARIANT}`)
}

const IS_DEV = APP_VARIANT === 'development'

const getBundleId = () => {
  const base = `xyz.${appId}.sensenet`

  if (APP_VARIANT === 'development') {
    return `${base}.dev`
  } else if (APP_VARIANT === 'preview') {
    return `${base}.preview`
  }

  return base
}

const getAppIcon = () => {
  return './assets/apps/app-icon.png'
}

const version = '0.0.6'

export default {
  expo: {
    name: `${appName}${(() => {
      switch (APP_VARIANT) {
        case 'development':
          return ' (Dev)'
        case 'preview':
          return ' (Preview)'
        default:
          return ''
      }
    })()}`,
    slug: 'fxy-vxrn',
    owner: `${appId}_labs`,
    scheme: appId,
    version,
    runtimeVersion: version, // must be set to use hot-updater "appVersion" update strategy
    newArchEnabled: true,
    platforms: ['ios', 'android', 'web'],
    userInterfaceStyle: 'dark',
    icon: getAppIcon(),
    ios: {
      supportsTablet: false,
      bundleIdentifier: getBundleId(),
      icon: getAppIcon(),
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        NSCameraUsageDescription:
          '$(PRODUCT_NAME) uses the camera to take profile photos and capture images for AI-powered image creation features.',
        NSMicrophoneUsageDescription: 'Allow $(PRODUCT_NAME) to access your microphone',
        NSPhotoLibraryUsageDescription:
          '$(PRODUCT_NAME) accesses your photo library to let you select images for profile pictures and choose photos as input for AI image generation.',
        NSPhotoLibraryAddUsageDescription:
          '$(PRODUCT_NAME) saves generated AI artwork and edited profile photos to your photo library so you can keep and share your creations.',
        NSAppleMusicUsageDescription:
          'Allow $(PRODUCT_NAME) to access your music library',
        UIBackgroundModes: ['fetch', 'remote-notification'],
      },
    },
    android: {
      package: getBundleId().replaceAll('-', '_'),
      icon: getAppIcon(),
      adaptiveIcon: {
        foregroundImage: './assets/apps/foregroundImage.png',
        backgroundImage: './assets/apps/backgroundImage.png',
      },
      edgeToEdgeEnabled: false,
      permissions: ['android.permission.RECORD_AUDIO'],
    },
    primaryColor: '#FFFFFF',
    plugins: [
      'vxrn/expo-plugin',
      'expo-secure-store',
      'expo-web-browser',
      'react-native-bottom-tabs',
      [
        'react-native-share',
        {
          ios: ['fb', 'instagram', 'twitter', 'tiktoksharesdk'],
          android: [
            'com.facebook.katana',
            'com.instagram.android',
            'com.twitter.android',
            'com.zhiliaoapp.musically',
          ],
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
            deploymentTarget: '17.0',
          },
        },
      ],
      [
        'expo-dev-client',
        {
          addGeneratedScheme: !!IS_DEV,
        },
      ],
      [
        'react-native-permissions',
        {
          // Add setup_permissions to your Podfile (see iOS setup - steps 1, 2 and 3)
          iosPermissions: [
            // 'AppTrackingTransparency',
            // 'Bluetooth',
            // 'Calendars',
            // 'CalendarsWriteOnly',
            'Camera',
            // 'Contacts',
            'FaceID',
            // 'LocationAccuracy',
            // 'LocationAlways',
            // 'LocationWhenInUse',
            'MediaLibrary',
            'Microphone',
            // 'Motion',
            'Notifications',
            'PhotoLibrary',
            // 'PhotoLibraryAddOnly',
            // 'Reminders',
            // 'Siri',
            // 'SpeechRecognition',
            // 'StoreKit',
          ],
        },
      ],
      [
        'expo-font',
        {
          fonts: [
            './assets/fonts/Inter-Black.ttf',
            './assets/fonts/Inter-Bold.ttf',
            './assets/fonts/Inter-Light.ttf',
            './assets/fonts/Inter-Medium.ttf',
            './assets/fonts/Inter-Regular.ttf',
            './assets/fonts/Inter-SemiBold.ttf',
            './assets/fonts/inter-tight/InterTight-Light.ttf',
            './assets/fonts/inter-tight/InterTight-Medium.ttf',
            './assets/fonts/inter-tight/InterTight-SemiBold.ttf',
          ],
        },
      ],
      [
        'react-native-bootsplash',
        {
          assetsDir: 'assets/bootsplash',
          android: {
            parentTheme: 'TransparentStatus',
          },
        },
      ],
      [
        '@hot-updater/react-native',
        {
          channel: APP_VARIANT,
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '3fb17679-9226-4a55-bf26-25ab9c3473e8',
      },
    },
  } satisfies ExpoConfig,
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
}
