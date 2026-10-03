import { H2, YStack } from 'tamagui'
import { LogoIcon } from '~/interface/app/LogoIcon'

export default () => {
  return (
    <YStack py="18" items="center" gap="4">
      <LogoIcon size={38} />
      <H2>Not found :/</H2>
    </YStack>
  )
}
