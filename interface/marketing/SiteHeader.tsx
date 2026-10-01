import { memo, useEffect, useState } from 'react'
import { isWeb, SizableText, Spacer, useMedia, XStack, YStack } from 'tamagui'
import { useAuth } from '~/auth/client/authClient'
import { APP_HOME_HREF } from '~/features/app/routes'
import { Link } from '~/interface/app/Link'
import { Button } from '~/interface/buttons/Button'
import { PromoLinksRow } from './PromoLinksRow'
import { SiteHeaderMenu } from './SiteHeaderMenu'
import { SocialLinksRow } from './SocialLinksRow'
import { TakeoutLogoIcon } from './TakeoutIcons'
import { ThemeSwitch } from './ThemeSwitch'

function TakeoutBrandmark() {
  return (
    <Link href="/" aria-label="Takeout Home">
      <XStack items="center" gap={8}>
        <TakeoutLogoIcon size={26} />
        <SizableText
          select="none"
          fontFamily="takeout-mono"
          size="5"
          fontWeight="700"
          letterSpacing={0.5}
        >
          Takeout
        </SizableText>
      </XStack>
    </Link>
  )
}

export const SiteHeader = memo(() => {
  const [isScrolled, setIsScrolled] = useState(false)
  const media = useMedia()
  const auth = useAuth()
  const isAuthed = auth.isLoggedIn

  useEffect(() => {
    if (!isWeb) return

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
      maxW="100vw"
    >
      <XStack width="100%" position="relative" maxW={1200} px={16} py={8}>
        <XStack
          transition="medium"
          flex={1}
          overflow="hidden"
          contain="paint"
          rounded={isScrolled ? 16 : 0}
          y={isScrolled ? 6 : 0}
          boxShadow={isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.15)' : 'none'}
        >
          {/* backdrop blur layer */}
          <YStack
            position="absolute"
            transition="medium"
            inset={0}
            opacity={isScrolled ? 1 : 0}
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          />

          <YStack
            opacity={isScrolled ? 0.85 : 0}
            position="absolute"
            inset={0}
            bg="color-2"
          />

          <XStack z={1} width="100%" items="center" py={8} px={12} position="relative">
            {/* left: social and promo links on desktop */}
            <XStack display="none md:flex" gap={12} items="center">
              <SocialLinksRow />
              <PromoLinksRow />
            </XStack>

            {/* mobile logo: left aligned */}
            <XStack display="md:none">
              <TakeoutBrandmark />
            </XStack>

            {/* desktop logo: centered */}
            <XStack
              display="none md:flex"
              position="absolute"
              left="50%"
              style={{ transform: 'translateX(-50%)' }}
            >
              <TakeoutBrandmark />
            </XStack>

            <Spacer flex={1} />

            {/* right: actions */}
            <XStack gap={8} items="center" display="none md:flex">
              <Link
                href={isAuthed ? APP_HOME_HREF : '/auth/login'}
                testID={media.md ? 'public-app-entry' : undefined}
                data-testid={media.md ? 'public-app-entry' : undefined}
                asChild
              >
                <Button
                  render="a"
                  size="sm"
                  fontFamily="takeout-body"
                  variant={isAuthed ? 'outlined' : undefined}
                  testID={media.md ? 'public-app-entry' : undefined}
                  data-testid={media.md ? 'public-app-entry' : undefined}
                >
                  {isAuthed ? 'Open app' : 'Login'}
                </Button>
              </Link>

              <Link href="/docs/intro" asChild>
                <Button render="a" size="sm" variant="outlined">
                  Docs
                </Button>
              </Link>

              <ThemeSwitch />
            </XStack>

            <SiteHeaderMenu />
          </XStack>
        </XStack>
      </XStack>
    </XStack>
  )
})
