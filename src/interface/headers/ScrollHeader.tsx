import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { XStack, YStack, isClient } from 'tamagui'
import Glint from '~/interface/effects/Glint'

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
      items="center"
      justify="center"
      z={50}
      style={{ position: 'fixed' }}
    >
      <XStack width="100%" position="relative" maxW={1200}>
        <XStack
          animation="medium"
          px="$4"
          width="100%"
          overflow="hidden"
          rounded={'$10'}
          y={isScrolled ? 6 : 0}
          contain="paint"
        >
          {isScrolled && <Glint rounded="$10" />}

          <YStack
            position="absolute"
            animation="medium"
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
            rounded={'$10'}
          />

          <XStack z={1} width="100%">
            {children}
          </XStack>
        </XStack>
      </XStack>
    </XStack>
  )
}
