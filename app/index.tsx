import { H1, YStack } from 'tamagui'
import { Link } from '~/features/routing/Link'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'

export const IndexPage = () => {
  return (
    <YStack flex={1} items="center" justify="center">
      <H1>Welcome</H1>
      <Link href="/login">
        <ButtonSimple>Login</ButtonSimple>
      </Link>
    </YStack>
  )
}
