import { memo } from 'react'
import { isWeb, View, YStack } from 'tamagui'
import { animationClamped } from '../animations/animationClamped'

export const IntroBackground = memo(() => {
  return (
    <>
      <View position="absolute" inset={0} bg="#050505" backgroundSize="contain" />

      {isWeb && (
        <YStack
          opacity={0.25}
          animation={animationClamped('superLazy')}
          contain="strict"
          fullscreen
          scale={1.25}
        >
          {/* <div className="dithered-shape square-shape">
                          <div className="square-pattern pixelated"></div>
                        </div> */}

          <div className="dithered-shape circle-shape">
            <div className="circle-pattern pixelated"></div>
          </div>

          {/* <div className="dithered-shape triangle-shape">
            <div className="triangle-pattern pixelated"></div>
          </div> */}
        </YStack>
      )}
    </>
  )
})
