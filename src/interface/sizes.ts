export type SimpleSize = 'large' | 'medium' | 'small'

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
