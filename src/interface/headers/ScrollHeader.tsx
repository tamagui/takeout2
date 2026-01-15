import { useEffect, useState } from 'react'
import { XStack, YStack, isClient } from 'tamagui'

import type { ReactNode } from 'react'

export const ScrollHeader = ({ children }: { children: ReactNode }) => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    if (!isClient) return

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
      $platform-web={{
        position: 'fixed',
        maxW: '100vw',
      }}
    >
      <XStack width="100%" position="relative" maxW={1200}>
        <XStack
          transition="medium"
          flex={1}
          overflow="hidden"
          contain="paint"
          $md={{
            rounded: '$10',
            y: 0,
            shadowColor: 'transparent',
            ...(isScrolled && {
              y: 6,
              shadowColor: '$shadow4',
              shadowRadius: 8,
              shadowOffset: { height: 2, width: 0 },
            }),
          }}
        >
          <YStack
            position="absolute"
            transition="medium"
            inset={0}
            style={{
              ...(isScrolled && {
                backdropFilter: `blur(16px)`,
                WebkitBackdropFilter: `blur(16px)`,
              }),
            }}
          />

          <YStack
            opacity={isScrolled ? 0.85 : 0}
            position="absolute"
            inset={0}
            bg="$color2"
            $md={{ rounded: '$10' }}
          />

          <XStack z={1} width="100%" items="center">
            {children}
          </XStack>
        </XStack>
      </XStack>
    </XStack>
  )
}
