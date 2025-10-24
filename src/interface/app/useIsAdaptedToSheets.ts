// tamagui could help us here

import { isTouchable, useMedia } from 'tamagui'

export const useIsAdaptedToSheets = () => {
  const isMediaActive = useMedia().maxMD
  return isTouchable && isMediaActive
}
