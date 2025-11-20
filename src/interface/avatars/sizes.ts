import type { SimpleSize } from '~/interface/types/sizes'

export type { SimpleSize }

export const simpleSizeContentHeight: Record<SimpleSize, number> = {
  small: 24,
  medium: 32,
  large: 38,
}

export const getSimpleSize = (value?: SimpleSize | number) => {
  return typeof value === 'string'
    ? simpleSizeContentHeight[value]
    : (value ?? simpleSizeContentHeight.medium)
}
