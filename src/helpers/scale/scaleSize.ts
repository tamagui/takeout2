import { Dimensions } from 'react-native'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

// design dimensions
const DESIGN_WIDTH = 402
const DESIGN_HEIGHT = 874

// calculate scale factors
const scaleFactorWidth = screenWidth / DESIGN_WIDTH
const scaleFactorHeight = screenHeight / DESIGN_HEIGHT

// use the smaller scale factor to maintain aspect ratio
const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight)

/**
 * Scale a size value based on the design dimensions
 * @param size - The size in the design (402x874)
 * @returns The scaled size for the current screen
 */
export const scaleSize = (size: number): number => {
  return Math.round(size * scaleFactor)
}
