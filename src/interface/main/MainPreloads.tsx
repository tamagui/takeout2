import { useUser } from '~/features/user/useUser'

export const MainPreloads = () => {
  // const serverId = useCurrentServerId()
  // const currentChannelId = useCurrentChannelId()
  // lets keep alive channel queries at least a few of them so its fast to switch
  // const serverChannels = useServerChannels(serverId)
  const { user } = useUser()

  return (
    <>
      {/* preload */}
      {user?.servers?.map((server) => {
        return <ServerPreloads key={server.id} serverId={server.id} />
      })}

      {/* preload messages in each channel */}
      {/* {serverChannels.map((channel) => {
              if (!channel.id) return null
              // dont preload the active channel
              if (channel.id === currentChannelId) return null
              return (
                <ChannelPreloads key={channel.id} serverId={serverId} channelId={channel.id} />
              )
            })} */}
    </>
  )
}
const ServerPreloads = (_: { serverId: string }) => {
  return null
}
