import { Dimensions } from 'react-native'

// TODO move to useWindowDimensions from tamagui

export const kWidth = Dimensions.get('window').width
export const kHeight = Dimensions.get('window').height

// Additional exports for auth pages
export const isSmallScreen = kWidth < 768
