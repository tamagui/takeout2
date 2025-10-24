import { memo } from 'react'
import { LinearGradient } from '@tamagui/linear-gradient'
import { YStack } from 'tamagui'
import { IS_SAFARI } from '@vxrn/helpers'
import { useChannelMeta } from '~/features/server/useChannelMeta'
import { MAIN_CONTENT_RADIUS, MAIN_CONTENT_RADIUS_LEFT } from '../constants'
import { GradientBlurUp } from '../effects/GradientBlur'
import { useAppTheme } from '../../features/app/AppTheme'

// TODO redo this - instead of chrome having a seaprate blur arae, just have the entire fade
// effect in chrome pushed inward by the radius, its way simpler, no need to fork it, and the blur
// right now looks bad because handoff between the two is not right

export const MainLayoutTopFadeEffect = memo(() => {
  const { colors } = useAppTheme()
  const { bannerHeight } = useChannelMeta()
  const baseHeight = 95 + bannerHeight

  return (
    <>
      {!IS_SAFARI && (
        <>
          {/* chrome doesn't let us do overflow hidden around a gradient blur */}
          {/* so instead we push the gradient blur down below the corner radius */}
          {/* then we just have a regular blur for that upper radius */}
          <GradientBlurUp
            height={baseHeight - MAIN_CONTENT_RADIUS_LEFT}
            top={MAIN_CONTENT_RADIUS_LEFT}
          />

          {/* BUT safari doesn't like handing off the blurs, so instead we DONT do this on safari */}
          <YStack
            position="absolute"
            z={1}
            pointerEvents="none"
            t={0}
            l={0}
            r={0}
            borderTopLeftRadius={MAIN_CONTENT_RADIUS_LEFT}
            borderTopRightRadius={MAIN_CONTENT_RADIUS}
            backdropFilter="blur(8px)"
            height={MAIN_CONTENT_RADIUS_LEFT + 12}
          />
        </>
      )}

      {IS_SAFARI && (
        <YStack
          position="absolute"
          z={1}
          pointerEvents="none"
          t={0}
          l={0}
          r={0}
          borderTopLeftRadius={MAIN_CONTENT_RADIUS_LEFT}
          borderTopRightRadius={MAIN_CONTENT_RADIUS}
          overflow="hidden"
          height={baseHeight}
        >
          {/* negative top avoids flickering effect at edges */}
          <GradientBlurUp height={baseHeight + 10} top={-10} />
        </YStack>
      )}

      <YStack
        position="absolute"
        z={1}
        pointerEvents="none"
        t={0}
        l={0}
        r={0}
        borderTopLeftRadius={MAIN_CONTENT_RADIUS_LEFT}
        borderTopRightRadius={MAIN_CONTENT_RADIUS}
        height={baseHeight - 30}
        overflow="hidden"
        contain="paint"
        opacity={0.85}
      >
        <LinearGradient
          fullscreen
          colors={[colors.mainLayoutBackground, '$background0']}
        />
      </YStack>
    </>
  )
})
