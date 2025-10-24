import type { ViewProps } from 'tamagui'
import { isTauri } from '@vxrn/helpers'

const maxZIndex = Number.MAX_SAFE_INTEGER
export const Z_INDICES = {
  toast: maxZIndex,
  tooltip: maxZIndex - 1,
  hotmenu: 10_000,
  appview: 1_000_000,
}

export const TOP_BAR_HEIGHT = 46

export const MAIN_CONTENT_RADIUS = isTauri ? 9 : 11
export const MAIN_CONTENT_RADIUS_INSET = Math.round(MAIN_CONTENT_RADIUS * 1.25)
export const MAIN_CONTENT_RADIUS_LEFT = MAIN_CONTENT_RADIUS + 3
export const MAIN_PAD_PANE = isTauri ? 8 : 7

export const MAIN_CONTENT_RADIUS_PROPS: ViewProps = {
  borderTopLeftRadius: MAIN_CONTENT_RADIUS_LEFT,
  borderBottomLeftRadius: MAIN_CONTENT_RADIUS_LEFT,
  borderTopRightRadius: MAIN_CONTENT_RADIUS,
  borderBottomRightRadius: MAIN_CONTENT_RADIUS,
}

export const MAIN_CONTENT_RADIUS_BORDER_PROPS: ViewProps = {
  borderTopLeftRadius: MAIN_CONTENT_RADIUS_LEFT - 1,
  borderBottomLeftRadius: MAIN_CONTENT_RADIUS_LEFT - 1,
  borderTopRightRadius: MAIN_CONTENT_RADIUS - 1,
  borderBottomRightRadius: MAIN_CONTENT_RADIUS - 1,
}

export const MESSAGE_MAX_WIDTH = 740
// match the content of messages basically (minus avatar space so a bit narrower)
export const MESSAGE_MAX_WIDTH_CALC = `min(100%, ${MESSAGE_MAX_WIDTH}px)`
export const MESSAGE_ACTION_ICON_SIZE = 14

export const MESSAGE_LIST_BOTTOM_PAD = 92

export const INPUT_DEFAULT_HEIGHT = 69

// for in-development features
export const DEV_MODE = process.env.NODE_ENV === 'development'
