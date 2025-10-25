import { scaleSize } from '~/helpers/scale/scaleSize'

export const useTabIconSize = () => {
  const iconSize = scaleSize(32)
  const smallerIconSize = iconSize - 2

  return {
    iconSize,
    smallerIconSize,
  }
}
