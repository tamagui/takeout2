import { useEffect } from 'react'
import { Spacer, styled, View, XStack, YStack } from 'tamagui'
import { useEmitterSelector } from '@vxrn/helpers'
import { LoginSignupContents } from '~/auth/ui/LoginSignupContents'
import { AppsSection } from '~/features/website/AppsSection'
import { ContainerLarge } from '~/features/website/Container'
import { DataSection } from '~/features/website/DataSection'
import { Hero } from '~/features/website/Hero'
import { HeroBackground } from '~/features/website/HeroBackground'
import { HomeSection } from '~/features/website/HomeSection'
import { homeEmitter, clearSectionPositions } from '~/features/website/homeEmitter'
import { HudSection } from '~/features/website/HudSection'
import { Showcase } from '~/features/website/Showcase'
import { OverviewSection } from '~/features/website/OverviewSection'
import { TasksSection } from '~/features/website/TasksSection'
import { Link } from '~/interface/app/Link'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import './home.css'

// TODO: window import breaks build - we need to fix one to not render on server in SPA mode
if (typeof window !== 'undefined') {
  // @ts-ignore
  void import('scroll-timeline-polyfill/dist/scroll-timeline.js')
}

const ScrollSection = styled(View, {
  minH: '100vh',
  maxH: 950,
  py: '$6',
  position: 'relative',
})

// TODO loader not working
// export const loader = async () => {
//   return {
//     appSnapshot: await readFile('./public/app-snapshot.html', 'utf-8'),
//   }
// }

export const HomePage = () => {
  // const { appSnapshot } = useLoader(loader)
  // console.info('appSnapshot', appSnapshot)

  // Use emitter selector to subscribe to section positions
  const sectionPositions = useEmitterSelector(homeEmitter, (state) => state)

  useEffect(() => {
    // Clear positions on mount
    clearSectionPositions()

    // Add loaded class after initial animations
    const timer = setTimeout(() => {
      document.body.classList.add('loaded')
    }, 3200) // After animations complete

    return () => {
      clearTimeout(timer)
    }
  }, [])

  if (process.env.NODE_ENV === 'production') {
    return (
      <>
        <LoginSignupContents />
      </>
    )
  }

  return (
    <>
      <div className="body-scrollable" />

      <HeroBackground />

      <div className="home-container">
        <YStack position="absolute" t={0} l={0} r={0} z={10000}>
          <ContainerLarge>
            <XStack py="$3">
              <Spacer flex />
              <Link fontFamily="$mono" href="/_/login">
                <ButtonSimple size="tiny">Login</ButtonSimple>
              </Link>
            </XStack>
          </ContainerLarge>
        </YStack>

        <div className="sticky-animation-container">
          <ContainerLarge>
            <Showcase sectionPositions={sectionPositions} />
          </ContainerLarge>
        </div>

        <HomeSection sectionId="hero" className="page-section">
          <Hero />
        </HomeSection>

        <OverviewSection />

        <HudSection />

        <AppsSection />

        <DataSection />

        <TasksSection />
      </div>
    </>
  )
}
