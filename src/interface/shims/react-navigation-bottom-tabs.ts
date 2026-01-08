// stub for @react-navigation/bottom-tabs on web
// one framework imports this even on web, but doesn't actually use it
// this shim prevents the full package from being bundled

import { createContext } from 'react'

export const BottomTabBarHeightContext = createContext<number | undefined>(undefined)
export const BottomTabBarHeightCallbackContext = createContext<
  ((height: number) => void) | undefined
>(undefined)

export function createBottomTabNavigator() {
  return {
    Navigator: () => null,
    Screen: () => null,
    Group: () => null,
  }
}

export const BottomTabBar = () => null

export function useBottomTabBarHeight() {
  return 0
}
