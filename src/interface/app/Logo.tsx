import { SizableText, XStack } from 'tamagui'

import { Image } from '../image/Image'
import { BetaBadge } from './BetaBadge'
import { LogoIcon } from './LogoIcon'

export const Logo = ({ height = 24 }: { height?: number }) => {
  return (
    <XStack items="center">
      {/* <LogoIcon size={height} /> */}
      <Image src="/TAKEOUT.webp" width={1229 * 0.09} height={520 * 0.09} />
      {/* <SizableText
        select="none"
        fontFamily="$mono"
        fontSize={Math.round(height * 0.75)}
        lineHeight={Math.round(height * 0.65)}
        fontWeight="600"
        $maxMD={{ display: 'none' }}
      >
        Takeout2
      </SizableText> */}
      <BetaBadge
        {...{
          position: 'absolute',
          t: 0,
          r: 0,
          transformOrigin: 'right top',
          x: '20%',
          y: '10%',
          scale: 0.8,
        }}
      />
    </XStack>
  )
}
