import { useEffect } from 'react'
import { isClient, useDidFinishSSR, useTheme } from 'tamagui'
import { emptyFn } from '@take-out/helpers'
import { isTauri } from '@take-out/helpers'

export const MetaThemeName = isTauri
  ? emptyFn
  : () => {
      const isHydrated = useDidFinishSSR()
      const theme = useTheme()
      // const [isActive, setIsActive] = useState(false)

      const color = theme['color1']?.val

      useEffect(() => {
        if (!isClient) return
        if (!isHydrated) return
        document.querySelector('#theme-color')?.setAttribute('content', color)
        // document.body.style.setProperty('background-color', color, 'important')
      }, [isHydrated, color])

      return null
      // return (
      //   <>
      //     <YStack
      //       id={`theme-name-effect`}
      //       ref={() => {
      //         setIsActive(true)
      //       }}
      //     />
      //     {/* {isWeb && <style>{`body { background: var(--color1}) !important; }`}</style>} */}
      //   </>
      // )
    }
