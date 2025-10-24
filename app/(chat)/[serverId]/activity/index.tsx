import { View } from 'tamagui'
import { Logo } from '~/interface/app/Logo'

export default function ActivityPage() {
  return (
    <View width="100%" flex={1}>
      <View opacity={0.35} flex={1} items="center" justify="center">
        <Logo />
      </View>
    </View>
  )
}
