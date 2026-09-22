import { IS_BROWSER } from '~/constants/platform'
import { useEffect, useState } from 'react'
import { html, XStack, YStack } from 'tamagui'

import type { ReactNode } from 'react'

export const ScrollHeader = ({ children }: { children: ReactNode }) => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    if (!IS_BROWSER) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <html.header
      display="flex"
      t={0}
      l={0}
      r={0}
      z={50}
      items="center"
      justify="center"
      w="100%"
      position="fixed"
      maxW="web:100vw"
    >
      <XStack w="100%" position="relative" maxW={1200}>
        <XStack
          transition="medium"
          flex={1}
          overflow="hidden"
          contain="paint"
          rounded="md:10"
          y={`0 md:${isScrolled ? 6 : 0}`}
          shadowColor={isScrolled ? 'shadow-color' : 'transparent'}
          shadowRadius={isScrolled ? 8 : 0}
          shadowOffset={isScrolled ? { height: 2, width: 0 } : undefined}
        >
          <YStack
            position="absolute"
            transition="medium"
            inset={0}
            opacity={`1 md:${isScrolled ? 1 : 0}`}
            backdropFilter="blur(16px)"
          />

          <YStack
            opacity={`0.35 md:${isScrolled ? 0.85 : 0}`}
            rounded="md:10"
            position="absolute"
            inset={0}
            bg="color2"
          />

          <XStack z={1} w="100%" items="center">
            {children}
          </XStack>
        </XStack>
      </XStack>
    </html.header>
  )
}
