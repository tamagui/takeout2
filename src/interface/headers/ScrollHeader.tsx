import { IS_BROWSER } from '~/constants/platform'
import { useEffect, useState } from 'react'
import { XStack, YStack } from 'tamagui'

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
    <XStack
      t={0}
      l={0}
      r={0}
      z={50}
      items="center"
      justify="center"
      width="100%"
      position="fixed"
      maxW="web:100vw"
    >
      <XStack width="100%" position="relative" maxW={1200}>
        <XStack
          transition="medium"
          flex={1}
          overflow="hidden"
          contain="paint"
          rounded="md:10"
          y={`md:${isScrolled ? 6 : 0}px`}
          boxShadow={`md:0 2px 8px ${isScrolled ? 'shadow3' : 'transparent'}`}
        >
          <YStack
            position="absolute"
            transition="medium"
            inset={0}
            opacity={`1 md:${isScrolled ? 1 : 0}`}
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          />

          <YStack
            opacity={`0.35 md:${isScrolled ? 0.85 : 0}`}
            rounded="md:10"
            position="absolute"
            inset={0}
            bg="color2"
          />

          <XStack z={1} width="100%" items="center">
            {children}
          </XStack>
        </XStack>
      </XStack>
    </XStack>
  )
}
