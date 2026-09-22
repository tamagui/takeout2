import { SizableText, XStack } from 'tamagui'

import { LogoIcon } from './LogoIcon'

export const Logo = () => {
  return (
    <XStack items="center" gap="md:12px">
      <LogoIcon size={24} />
      <SizableText
        select="none"
        fontFamily="mono"
        fontSize="16px"
        lineHeight="16px"
        fontWeight="600"
        letterSpacing={0.5}
        display="max-md:none"
      >
        Takeout
      </SizableText>
    </XStack>
  )
}
