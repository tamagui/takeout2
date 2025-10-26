import { memo } from 'react'
import { YStack } from 'tamagui'
import { IS_SAFARI } from '@vxrn/helpers'
import { GradientBlurDown } from '~/interface/effects/GradientBlur'
import { MAIN_CONTENT_RADIUS, MAIN_CONTENT_RADIUS_LEFT } from '../constants'
import { LinearGradient } from '@tamagui/linear-gradient'

export const MainLayoutBottomFadeEffect = memo(() => {
  return (
    <YStack
      pointerEvents="none"
      z={1}
      position="absolute"
      b={0}
      l={0}
      r={0}
      height={26}
      {...{
        borderBottomLeftRadius: MAIN_CONTENT_RADIUS_LEFT,
        borderBottomRightRadius: MAIN_CONTENT_RADIUS,
        overflow: 'hidden',
      }}
      // {...(IS_SAFARI
      //   ? {
      //       borderBottomLeftRadius: MAIN_CONTENT_RADIUS_LEFT,
      //       borderBottomRightRadius: MAIN_CONTENT_RADIUS,
      //       overflow: 'hidden',
      //     }
      //   : {
      //       l: MAIN_CONTENT_RADIUS_LEFT,
      //       r: MAIN_CONTENT_RADIUS,
      //     })}
    >
      {/* negative margin at bottom avoids flickering at edge */}

      <YStack fullscreen $theme-dark={{ display: 'none' }}>
        <LinearGradient
          position="absolute"
          z={10}
          b={0}
          l={0}
          r={0}
          height="100%"
          colors={['$background0', '$color1pt5']}
        />
      </YStack>

      <YStack fullscreen $theme-light={{ display: 'none' }}>
        <LinearGradient
          position="absolute"
          z={10}
          b={0}
          l={0}
          r={0}
          height="100%"
          colors={['$background0', '$color2pt5']}
        />
      </YStack>

      {/* <GradientBlurDown /> */}

      {/* {IS_SAFARI ? (
        <YStack fullscreen overflow="hidden">
          <GradientBlurDown bottom={-10} />
        </YStack>
      ) : (
        <GradientBlurDown />
      )} */}

      {/* tauri has a weird gradient blur darkening effect because of vibrancy behind, we adjust */}
      {/* by lightening the gradient a bit */}
      {/* {isTauri ? (
        <>
          <LinearGradient
            position="absolute"
            z={10}
            opacity={0.22}
            b={0}
            l={0}
            r={0}
            height={25}
            colors={['$color0', '$color02']}
          />
          <LinearGradient
            position="absolute"
            z={10}
            opacity={0.6}
            b={0}
            l={0}
            r={0}
            height={20}
            colors={['$color0', colors.mainLayoutBackground]}
          />
        </>
      ) : null} */}
    </YStack>
  )
})
