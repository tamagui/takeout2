import { isWeb } from 'tamagui'

interface PositionConfig {
  l?: number
  r?: number
  t: number
  rotate: string
}

export interface LayoutConfig {
  positions: PositionConfig[]
  cardWidthRatio: number
  cardHeight: number
  containerHeight: number
}

export const LAYOUT_CONFIGS: Record<'rotated' | 'cascade' | 'stack', LayoutConfig> = isWeb
  ? {
      rotated: {
        positions: [
          { l: 0, t: 0, rotate: '-5deg' },
          { r: 0, t: 70, rotate: '4deg' },
          { l: 10, t: 140, rotate: '-3deg' },
          { r: 10, t: 210, rotate: '5deg' },
        ],
        cardWidthRatio: 0.8,
        cardHeight: 56,
        containerHeight: 300,
      },
      cascade: {
        positions: [
          { r: 0, t: 0, rotate: '6deg' },
          { l: 0, t: 70, rotate: '-4deg' },
          { r: 5, t: 140, rotate: '3deg' },
          { l: 5, t: 210, rotate: '-5deg' },
        ],
        cardWidthRatio: 0.8,
        cardHeight: 56,
        containerHeight: 300,
      },
      stack: {
        positions: [
          { l: 0, t: 0, rotate: '0deg' },
          { l: 0, t: 62, rotate: '0deg' },
          { l: 0, t: 124, rotate: '0deg' },
          { l: 0, t: 186, rotate: '0deg' },
        ],
        cardWidthRatio: 0.85,
        cardHeight: 54,
        containerHeight: 300,
      },
    }
  : {
      rotated: {
        positions: [
          { l: 0, t: 0, rotate: '-5deg' },
          { r: 0, t: 90, rotate: '4deg' },
          { l: 10, t: 180, rotate: '-3deg' },
          { r: 10, t: 270, rotate: '5deg' },
        ],
        cardWidthRatio: 0.75,
        cardHeight: 72,
        containerHeight: 380,
      },
      cascade: {
        positions: [
          { r: 0, t: 0, rotate: '6deg' },
          { l: 0, t: 85, rotate: '-4deg' },
          { r: 5, t: 175, rotate: '3deg' },
          { l: 5, t: 265, rotate: '-5deg' },
        ],
        cardWidthRatio: 0.75,
        cardHeight: 72,
        containerHeight: 380,
      },
      stack: {
        positions: [
          { l: 0, t: 0, rotate: '0deg' },
          { l: 0, t: 78, rotate: '0deg' },
          { l: 0, t: 156, rotate: '0deg' },
          { l: 0, t: 234, rotate: '0deg' },
        ],
        cardWidthRatio: 0.72,
        cardHeight: 68,
        containerHeight: 350,
      },
    }

export const GRID_ROTATIONS = ['-3deg', '2deg', '2deg', '-3deg']
