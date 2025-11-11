import { useEffect } from 'react'
import { isClient, useDidFinishSSR, useTheme } from 'tamagui'

export const MetaThemeName = () => {
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
}
