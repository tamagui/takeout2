import { YStack } from 'tamagui'
import { ChannelSettingsContent } from '~/features/channel/ui/ChannelSettingsContent.native'
import { ChannelSettingsPageHeader } from '~/features/channel/ui/ChannelSettingsPageHeader.native'
import { useCurrentServer } from '~/features/server/useCurrentServer'

export default function ChannelSettingsPage() {
  const { channel } = useCurrentServer()
  return (
    <YStack flex={1} bg="$surface">
      <ChannelSettingsPageHeader title={channel?.name || ''} />
      <ChannelSettingsContent />
    </YStack>
  )
}
