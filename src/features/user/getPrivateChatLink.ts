export const getPrivateChatLink = ({
  serverId,
  channelId,
  userServerId,
}: {
  serverId?: string
  channelId?: string
  userServerId: string
}) => {
  // either a private chat within an existing server or one independent of any server

  if (serverId && channelId) {
    return `/${serverId}/${channelId}/?userServerId=${userServerId}`
  }

  return `/private/${userServerId}?serverId=${serverId}&channelId=${channelId}`
}
