import { router } from 'one'
import { YStack } from 'tamagui'
import { ChannelSettingsHeader } from '~/features/channel/ui/ChannelSettingsHeader.native'
import { ChannelSettingsTabs } from '~/features/channel/ui/ChannelSettingsTabs.native'
import { useServerParams } from '~/features/server/useServerParams'

export default function SettingsPage() {
  const params = useServerParams()
  const { serverId, channelId } = params

  const handleSettingsPress = () => {
    router.push(`/${serverId}/${channelId}/settings/channel-settings`)
  }

  return (
    <YStack flex={1} bg="$surface">
      <ChannelSettingsHeader onSettingsPress={handleSettingsPress} />
      <ChannelSettingsTabs />
    </YStack>
  )
}
