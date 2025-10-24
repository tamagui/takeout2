import { memo, useEffect, useState } from 'react'
import { useDebounce, View } from 'tamagui'
import { createEmitter, useEmitterValue } from '@vxrn/helpers'
import type { Timer } from '@vxrn/helpers'
import { attachmentEmitter } from '../upload/DragDropFile'
import { isEqualIdentity } from '@vxrn/helpers'

export type FullScreenProgressBarProps = {
  /** How long after a navigation to wait before showing the progress bar (in ms) */
  startDelay?: number
  /** How long after a navigation completes to wait before hiding the progress bar (in ms) */
  finishDelay?: number
  /** The starting percent it should show the state state at */
  initialPercent?: number
  /** How often the progress bar should update (in ms) */
  updateInterval?: number
  /** How often to skip an update (checked each during the loop) */
  sporadicness?: number
}

export const fullScreenProgressBar = createEmitter<'loading' | 'complete' | 'idle'>(
  'fullScreenProgressBar',
  'idle',
  {
    comparator: isEqualIdentity,
  }
)

attachmentEmitter.listen((value) => {
  const status = value[0]?.status
  if (status === 'uploading') {
    fullScreenProgressBar.emit('loading')
  }
  if (!status || status === 'complete' || status === 'error') {
    fullScreenProgressBar.emit('complete')
  }
})

export const FullScreenProgressBar = memo(
  ({
    startDelay = 500,
    finishDelay = 250,
    initialPercent = 20,
    updateInterval = 300,
    sporadicness = 3,
    ...props
  }: FullScreenProgressBarProps) => {
    const state = useEmitterValue(fullScreenProgressBar)
    const [loaded, setLoaded] = useState(0) // 0 to 100
    const [width, setWidth] = useState(0)

    useEffect(() => {
      let loadInterval: Timer | undefined

      switch (state) {
        case 'loading': {
          loadInterval = setTimeout(() => {
            setLoaded(initialPercent)

            // to make it feel more realistic, we skip every N updates
            let intervalCount = 0

            loadInterval = setInterval(() => {
              intervalCount++

              if (intervalCount % sporadicness === 0) {
                return
              }

              setLoaded((prev) => {
                const increment = (100 - prev) * (prev > 80 ? 0.05 : 0.1) * Math.random()
                return Math.min(prev + increment, 100)
              })
            }, updateInterval)
          }, startDelay)
          break
        }

        case 'complete': {
          setLoaded(100)
          if (loadInterval) clearInterval(loadInterval)
          setTimeout(() => {
            fullScreenProgressBar.emit('complete')
          }, finishDelay)
          break
        }
      }

      return () => {
        clearInterval(loadInterval)
      }
    }, [state, finishDelay, initialPercent, sporadicness, startDelay, updateInterval])

    const setWidthDelayed = useDebounce((e) => {
      setWidth(e.nativeEvent.layout.width)
    }, 250)

    return (
      <View
        onLayout={setWidthDelayed}
        animation="quick"
        animateOnly={['transform']}
        display={state === 'complete' || loaded === 0 ? 'none' : 'flex'}
        height={2}
        position="absolute"
        b={0}
        l={0}
        r={0}
        bg="rgba(60, 100, 200, 0.65)"
        width="100%"
        transform={[{ translateX: -(1 - loaded * 0.01) * width }]}
        z={Number.MAX_SAFE_INTEGER}
        {...props}
      />
    )
  }
)
