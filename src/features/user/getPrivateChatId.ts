export const PRIVATE_CHAT_SEPARATOR = `~~~~~`

export const getPrivateChatId = (params: { userId1: string; userId2: string }) => {
  const [aId, bId] = [params.userId1, params.userId2].sort()
  return `${aId}${PRIVATE_CHAT_SEPARATOR}${bId}`
}
