import { useState } from 'react'
import { AnimatePresence, H1, Paragraph, Spacer, XStack, YStack } from 'tamagui'
import { useAuth } from '~/auth/client/authClient'
import { hotMenuEmitter } from '~/features/hud/useHotMenuItems'
import { MentionContent } from '~/features/mention/Mention'
import { useUserState } from '~/features/user/userState'
import { TypeWriter } from '~/features/website/TypeWriter'
import { AnimatedSteps } from '~/interface/animations/AnimatedSteps'
import { ButtonAction } from '../buttons/ButtonAction'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { Popover } from '../popover/Popover'
import { Link } from '../app/Link'

export const OnboardingTourHUDStart = ({ children }: { children: any }) => {
  const { user } = useAuth()

  // disabled in prod until finished
  if (process.env.NODE_ENV !== 'development-disable') {
    return children
  }

  if (!user) {
    return children
  }

  // TODO guided tour after dialogOnboard finishes using guidedNavigation and a floating window we control

  return (
    <Popover open name="onboard-tour-start">
      <Popover.Trigger>{children}</Popover.Trigger>

      <Popover.Content
        theme="accent"
        rounded="$10"
        shadow="strong"
        bg="transparent"
        backdropFilter="blur(20px)"
      >
        <OnboardingTourStartContent />
      </Popover.Content>
    </Popover>
  )
}

const OnboardingTourStartContent = () => {
  const { tourState } = useUserState('settings')
  const [showRest, setShowRest] = useState(false)

  const step = tourState?.startsWith('step-') ? +tourState.split('-')[1]! : 0
  const ContentComponent = steps[step]

  if (!ContentComponent) {
    return null
  }

  return (
    <YStack
      onPress={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      px="$5"
      py="$4"
      width={340}
      gap="$4"
      rounded="$10"
      overflow="hidden"
    >
      <YStack fullscreen bg="$color1" opacity={0.85} />
      {!showRest && (
        <H1 fontFamily="$mono" size="$6">
          <TypeWriter
            hideCursorOnComplete
            initialBlinks={2}
            finalBlinks={2}
            cursorSize={{ width: 14, height: 20 }}
            segments={[{ text: 'welcome :)' }]}
            onComplete={() => {
              setTimeout(() => {
                setShowRest(true)
              }, 500)
            }}
          />
        </H1>
      )}

      <AnimatePresence>{showRest && <ContentComponent />}</AnimatePresence>
    </YStack>
  )
}

const Step1Content = () => {
  const [subStep, setSubStep] = useState(0)
  const [showFinalStep, setShowFinalStep] = useState(false)

  const renderSubStep = () => {
    switch (subStep) {
      case 0:
        return (
          <Step
            forward={{
              onPress: () => {
                setSubStep(1)
              },
            }}
          >
            <Paragraph fontFamily="$mono" size="$5">
              i'm hud 👋
            </Paragraph>

            <Paragraph fontFamily="$mono" size="$4">
              i live up here in the HUD_BAR, giving you context on the current channel.
            </Paragraph>

            <Paragraph fontFamily="$mono" size="$4">
              let's take a quick tour of Start.
            </Paragraph>
          </Step>
        )

      case 1:
        return (
          <Step
            backward={{
              onPress: () => setSubStep(0),
            }}
            forward={{
              onPress: () => setSubStep(2),
            }}
          >
            <Paragraph fontFamily="$mono" size="$4">
              talk to me by mentioning me anywhere with{' '}
              <MentionContent type="user" user={{ username: 'hud' }} />.
            </Paragraph>

            <Paragraph fontFamily="$mono" size="$4">
              in chat, i have all sorts of{' '}
              <Link target="_blank" href="/">
                abilities
              </Link>
              ...
            </Paragraph>

            <Paragraph fontFamily="$mono" size="$4">
              👆 that link opens in a new window so you can learn about them later.
            </Paragraph>
          </Step>
        )

      case 2:
        return (
          <Step
            backward={{
              onPress: () => setSubStep(1),
            }}
            forward={{
              label: 'Open HUD',
              onPress: () => {
                hotMenuEmitter.emit({ type: 'open', value: '' })
                setTimeout(() => {
                  setSubStep(3)
                }, 800)
              },
            }}
          >
            <Paragraph fontFamily="$mono" size="$4">
              ... but, when you click on me, it gets a lot more interesting.
            </Paragraph>

            <Paragraph fontFamily="$mono" size="$4">
              that opens HUD_MODE, a true heads up display where you can search or chat
              with me in private, with context of what you're currently doing.
            </Paragraph>

            <Paragraph fontFamily="$mono" size="$4">
              you can also enter HUD_MODE by just hitting ⌘+f.
            </Paragraph>
          </Step>
        )

      case 3:
        return (
          <Step
            backward={{
              onPress: () => setSubStep(1),
            }}
            forward={{
              label: 'Close HUD',
              onPress: () => {
                hotMenuEmitter.emit({ type: 'close' })
                setSubStep(3)
              },
            }}
          >
            <Paragraph fontFamily="$mono" size="$4">
              <TypeWriter
                hideCursorOnComplete
                initialBlinks={0}
                cursorSize={{ width: 14, height: 20 }}
                segments={[{ text: '...?' }]}
                onComplete={() => {
                  setShowFinalStep(true)
                }}
              />
            </Paragraph>

            {showFinalStep && (
              <>
                <Paragraph fontFamily="$mono" size="$4">
                  nice.
                </Paragraph>

                <Paragraph fontFamily="$mono" size="$4">
                  HUD_MODE combines search, private chat, and context into a beautiful and
                  easy to use interface.
                </Paragraph>
              </>
            )}
          </Step>
        )

      default:
        return null
    }
  }

  return (
    <AnimatedSteps total={4} current={subStep} animation="quickLessBouncy">
      <YStack gap="$3">{renderSubStep()}</YStack>
    </AnimatedSteps>
  )
}

type StepAction = {
  label?: string
  onPress: () => void
}

const Step = ({
  children,
  backward,
  forward,
}: {
  children: any
  forward?: StepAction
  backward?: StepAction
}) => {
  return (
    <>
      {children}

      <Spacer flex />

      <XStack items="center" gap="$2" justify="space-between">
        {backward ? (
          <ButtonSimple
            disableGlint
            size="small"
            onPress={backward.onPress}
            self="flex-end"
          >
            {backward.label || 'Back'}
          </ButtonSimple>
        ) : (
          <Spacer size="$1" />
        )}

        {forward && (
          <ButtonAction size="small" onPress={forward.onPress}>
            {forward.label || 'Next'}
          </ButtonAction>
        )}
      </XStack>
    </>
  )
}

const steps = [Step1Content]
