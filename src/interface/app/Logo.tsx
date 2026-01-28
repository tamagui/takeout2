import { SizableText, XStack } from 'tamagui'

import { BetaBadge } from './BetaBadge'
import { LogoIcon } from './LogoIcon'

export const Logo = ({ height = 24 }: { height?: number }) => {
  return (
    <XStack items="center" $sm={{ gap: height / 2 }}>
      <LogoIcon size={height} />
      <SizableText
        select="none"
        fontFamily="$mono"
        fontSize={height * 0.65}
        lineHeight={height * 0.65}
        $maxSM={{ display: 'none' }}
      >
        Takeout
      </SizableText>
      <BetaBadge />
    </XStack>
  )
}
