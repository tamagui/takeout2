import type { YStackProps } from 'tamagui'
import type { Attachment, MessageWithRelations } from '~/data/types'

export interface AttachmentItemBaseProps {
  size?: 'small' | 'large'
  attachment: Attachment
  onPress?: YStackProps['onPress']
  hasVideo?: boolean
  isInput?: boolean
}

export interface AttachmentItemProps extends AttachmentItemBaseProps {
  editable?: boolean
  onDelete?: () => void
  confirmDelete?: boolean
  message?: MessageWithRelations
  index: number
}

export interface AttachmentItemMediaProps extends AttachmentItemBaseProps {
  isInput?: boolean
}

export interface AttachmentItemUnfurlProps extends AttachmentItemBaseProps {
  size?: 'small' | 'large'
}
