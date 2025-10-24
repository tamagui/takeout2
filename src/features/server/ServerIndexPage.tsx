import { isWeb } from 'tamagui'
import { ChannelMain } from '~/features/channel/ui/ChannelMain'
import { useServerParams } from '~/features/server/useServerParams'
import { SidebarServerChannelsList } from '~/interface/sidebar/SidebarServerChannelsList'
import { OnboardingTour } from '~/interface/tour/OnboardingTour'

export function ServerIndexPage() {
  const { serverId, message } = useServerParams()

  // On native, redirect to tabs home
  if (!isWeb) {
    return <SidebarServerChannelsList />
  }

  return (
    <>
      <OnboardingTour />
      <ChannelMain
        serverId={serverId || ''}
        message={message || ''}
        channelId={serverId || ''}
      />
    </>
  )
}
