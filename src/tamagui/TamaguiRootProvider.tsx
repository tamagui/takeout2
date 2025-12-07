import './tamagui.css'

import {
  MetaTheme,
  SchemeProvider,
  setSchemeSetting,
  useColorScheme,
} from '@vxrn/color-scheme'
import { usePathname } from 'one'
import { memo, useLayoutEffect } from 'react'
import { isWeb, TamaguiProvider, useTheme } from 'tamagui'

import { config } from './tamagui.config'

export const TamaguiRootProvider = memo(({ children }: { children: any }) => {
  const [scheme] = useColorScheme()
  const pathname = usePathname()
  const forceDark = pathname.startsWith('/_/')

  useLayoutEffect(() => {
    if (forceDark) {
      setSchemeSetting('dark')
    }
  }, [forceDark])

  return (
    <TamaguiProvider
      disableInjectCSS
      config={config}
      defaultTheme={forceDark ? 'dark' : scheme}
    >
      {isWeb && <ThemeMetaTag />}
      {forceDark && isWeb && <div className="body-dark" />}
      <SchemeProvider>{children}</SchemeProvider>
    </TamaguiProvider>
  )
})

const ThemeMetaTag = () => {
  const theme = useTheme()
  return <MetaTheme color={theme.background.val} darkColor={'#000'} lightColor="#fff" />
}
