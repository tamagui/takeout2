import type { AttachmentItemBaseProps } from './types'

export const ATTACHMENT_DISPLAY_SIZES = {
  small: 60,
  large: 120,
}

export const getAttachmentSize = (props: AttachmentItemBaseProps) => {
  const baseSize = ATTACHMENT_DISPLAY_SIZES[props.size || 'small']
  return baseSize * (props.hasVideo ? 2 : 1)
}
