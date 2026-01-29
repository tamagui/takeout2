import { XStack } from 'tamagui'

import { Image } from '../image/Image'
import { BetaBadge } from './BetaBadge'

export const Logo = () => {
  return (
    <XStack items="center" position="relative">
      <Image src="/TAKEOUT.webp" width={1229 * 0.09} height={520 * 0.09} />

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
