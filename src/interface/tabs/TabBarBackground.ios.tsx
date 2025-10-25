import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { BlurView } from 'expo-blur'
import { StyleSheet } from 'react-native'

export const TabBarBackground = () => {
  return <BlurView tint="dark" intensity={100} style={StyleSheet.absoluteFill} />
}

export const useBottomTabOverflow = () => {
  return useBottomTabBarHeight()
}
