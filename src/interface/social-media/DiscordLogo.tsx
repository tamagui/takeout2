// Discord Logo Component
import { YStack } from 'tamagui'

export const DiscordLogo = ({ size = 24 }: { size?: number }) => {
  return <YStack width={size} height={size} bg="$color8" rounded="$2" />
}

export default DiscordLogo
