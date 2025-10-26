// static dimensions for non-component usage
// prefer hooks when inside components

import { Dimensions } from 'react-native'

const windowDimensions = Dimensions.get('window')

export const kWidth = windowDimensions.width
export const kHeight = windowDimensions.height
export const isSmallScreen = kWidth < 768
