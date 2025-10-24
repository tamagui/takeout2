import { Plus } from '@tamagui/lucide-icons'
import { ScrollView, SizableText, Spinner, YStack } from 'tamagui'
import { useUserServers } from '~/features/server/useUserServers'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { dialogCreateServer } from '~/interface/dialogs/actions'
import { ServerListItem } from './ServerListItem'

export const TrendingServers = () => {
  const { allServers: topServers } = useUserServers()
  const handleCreateServer = async () => {
    try {
      await dialogCreateServer()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <ScrollView
      flex={1}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flex: 1 }}
    >
      <YStack
        animation="lazy"
        enterStyle={{ opacity: 0, y: 20, scale: 0.95 }}
        opacity={1}
        y={0}
        scale={1}
        flex={1}
        items="center"
        justify="center"
        gap="$3"
        px="$8"
        py="$4"
      >
        {/* Server List */}
        {topServers.map((server) => {
          return <ServerListItem link server={server} key={server.id} />
        })}
        {/* Create Server Button */}
        <YStack width="100%" items="center">
          <ButtonSimple
            active
            onPress={handleCreateServer}
            size="large"
            icon={Plus}
            py="$3"
            px="$4"
          >
            <ButtonSimple.Text fontFamily="$mono" fontWeight="600">
              Create a new server
            </ButtonSimple.Text>
          </ButtonSimple>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
