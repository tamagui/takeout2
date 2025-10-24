import type { FriendshipPrimaryIds } from '~/data/models/friendship'

export const PRIVATE_CHAT_SEPARATOR = `~~~~~`

export const getPrivateChatId = (friendship: FriendshipPrimaryIds) => {
  const [aId, bId] = [friendship.acceptingId, friendship.requestingId].sort()
  return `${aId}${PRIVATE_CHAT_SEPARATOR}${bId}`
}
