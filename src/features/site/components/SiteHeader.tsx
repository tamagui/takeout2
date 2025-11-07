import { router } from 'one'
import { XStack, YStack } from 'tamagui'
import { Logo } from '~/interface/brand/Logo'

export const SiteHeader = () => {
  return (
    <YStack borderBottomWidth={1} borderBottomColor="$color3" bg="$background">
      <XStack
        mx="auto"
        width="100%"
        maxW={840}
        px="$4"
        py="$4"
        items="center"
        justify="space-between"
      >
        <Logo onPress={() => router.push('/')} />
      </XStack>
    </YStack>
  )
}
