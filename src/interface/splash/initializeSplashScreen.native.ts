import * as SplashScreen from 'expo-splash-screen'

export function initializeSplashScreen() {
  // NOTE: we need to set the splash options at root layout for it to work on native
  SplashScreen.preventAutoHideAsync()
}
