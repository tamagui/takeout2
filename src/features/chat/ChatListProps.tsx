import type {
  ItemLocation,
  ListScrollLocation,
  VirtuosoMessageListProps,
} from '@virtuoso.dev/message-list'
import type { CSSProperties, RefObject } from 'react'
import type { MessageVariant } from '~/features/message/ui/MessageContent'
import type { MessageWithRelations } from '~/data/types'

export interface VListHandle {
  scrollToIndex: (opts: ItemLocation) => void
}

export type ChatListItem = MessageWithRelations

export type MessageItemPositioning = 'at-top' | 'was-top' | 'normal'

export type MessageItemStateRecord = Map<string, MessageItemState>

export type MessageItemState = {
  hideUser: boolean
  isNewDate: boolean
  positioning: MessageItemPositioning
}

export type MessageItemContext = {
  state: MessageItemStateRecord
  hasLoadedAll: boolean
  variant?: MessageVariant
}

export interface ItemProps {
  index: number
  data: ChatListItem
  prevData: ChatListItem | null
  nextData: ChatListItem | null
  context: MessageItemContext
}
type OGProps = VirtuosoMessageListProps<ChatListItem, MessageItemContext>

export interface ChatListProps {
  scrollToMessageId?: string
  items: readonly ChatListItem[]
  context: MessageItemContext
  ItemContent: OGProps['ItemContent']
  style?: CSSProperties
  onScrollToTop?: () => void
  onScroll?: (props: ListScrollLocation) => void
  ref?: RefObject<ChatListHandle | null>
  Header?: OGProps['Header']
  Footer?: OGProps['Footer']
}

export type ChatListHandle = {
  scrollToIndex: (index: number) => void
  scrollToBottomIfAtBottom: () => void
}
