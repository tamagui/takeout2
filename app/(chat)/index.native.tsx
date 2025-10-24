import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Image, YStack } from 'tamagui'
import { authClient, clearAuthClientToken } from '~/auth/client/authClient'
import { TrendingServers } from '~/features/server/ui/TrendingServers'
import { RedirectToLastPage } from '~/features/user/RedirectUserToLastPage.native'
import { dialogConfirm } from '~/interface/dialogs/actions'

export default function HomePage() {
  const { top } = useSafeAreaInsets()
  return (
    <YStack flex={1} bg="$surface">
      <RedirectToLastPage />
      <Image
        source={require('../../assets/images/words.png')}
        width={120}
        objectFit="contain"
        mt={top + 16}
        self="center"
      />
      <TrendingServers />
      <TmpLogoutBtn />
    </YStack>
  )
}

function TmpLogoutBtn() {
  return (
    <Button
      mb="$4"
      mx="$4"
      onPress={async () => {
        if (await dialogConfirm({ title: `Log out?` })) {
          await authClient.signOut()
          clearAuthClientToken()
        }
      }}
    >
      Logout
    </Button>
  )
}
