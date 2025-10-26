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

/**
 * Scale width based on screen width ratio
 * @param size - The width in the design
 * @returns The scaled width for the current screen
 */
export const scaleWidth = (size: number): number => {
  return Math.round(size * scaleFactorWidth)
}

/**
 * Scale height based on screen height ratio
 * @param size - The height in the design
 * @returns The scaled height for the current screen
 */
export const scaleHeight = (size: number): number => {
  return Math.round(size * scaleFactorHeight)
}

/**
 * Scale font size with a maximum scale limit
 * @param size - The font size in the design
 * @param maxScale - Maximum scale factor (default 1.2)
 * @returns The scaled font size
 */
export const scaleFontSize = (size: number, maxScale = 1.2): number => {
  const limitedScaleFactor = Math.min(scaleFactor, maxScale)
  return Math.round(size * limitedScaleFactor)
}

/**
 * Get raw scale factors for custom calculations
 */
export const getScaleFactors = () => ({
  scaleFactor,
  scaleFactorWidth,
  scaleFactorHeight,
  screenWidth,
  screenHeight,
  designWidth: DESIGN_WIDTH,
  designHeight: DESIGN_HEIGHT,
})
