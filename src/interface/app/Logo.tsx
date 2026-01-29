import { SizableText, XStack } from 'tamagui'

import { BetaBadge } from './BetaBadge'
import { LogoIcon } from './LogoIcon'

export const Logo = ({ height = 24 }: { height?: number }) => {
  return (
    <XStack items="center" $md={{ gap: height / 2 }}>
      <LogoIcon size={height} />
      <SizableText
        select="none"
        fontFamily="$mono"
        fontSize={Math.round(height * 0.65)}
        lineHeight={Math.round(height * 0.65)}
        fontWeight="600"
        letterSpacing={0.5}
        $max-md={{ display: 'none' }}
      >
        Takeout
      </SizableText>
      <BetaBadge />
    </XStack>
  )
}
