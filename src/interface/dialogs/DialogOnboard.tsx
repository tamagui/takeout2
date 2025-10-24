import { isTauri } from '@vxrn/helpers'
import { redirect, type Href } from 'one'
import { useState } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'
import { CreateServerForm } from '~/features/server/CreateServerForm'
import { UserProfileEditForm } from '~/features/user/ui/UserProfileEditForm'
import { Image } from '~/interface/image/Image'
import { zero } from '~/zero/client'
import { AnimatedSteps } from '../animations/AnimatedSteps'
import { ButtonAction } from '../buttons/ButtonAction'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { DropAreaFrame } from '../upload/DragDropFile'
import { Dialog } from './Dialog'
import { dialogEmit, useDialogEmit } from './shared'

export const DialogOnboard = () => {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState<'profile' | 'create-server' | 'notifications'>(
    'profile'
  )
  const stepNum = step === 'create-server' ? 1 : step === 'notifications' ? 2 : 0

  useDialogEmit((next) => {
    if (next.type === 'onboard') {
      if (!show) {
        setShow(true)
        setStep('profile')
      }
    } else {
      setShow(false)
    }
  })

  const finishOnboarding = (redirectTo?: Href) => {
    zero.mutate.userPublic.finishOnboarding()
    setShow(false)
    dialogEmit({ type: 'closed' })
    if (redirectTo) {
      // TODO type error?
      // @ts-expect-error
      redirect(redirectTo)
    }
  }

  const handleProfileComplete = () => {
    setStep('create-server')
  }

  const handleServerComplete = (serverId: string) => {
    if (isTauri) {
      setStep('notifications')
    } else {
      finishOnboarding(`/${serverId}`)
    }
  }

  const handleNotificationsComplete = () => {
    finishOnboarding()
  }

  const openSystemPreferences = async () => {
    if (isTauri) {
      const { open } = await import('@tauri-apps/plugin-shell')
      await open('x-apple.systempreferences:com.apple.preference.notifications')
    }
  }

  return (
    <Dialog
      data-testid="dialog-onboard"
      minH={300}
      open={show}
      onOpenChange={() => {
        if (show) {
          dialogEmit({ type: 'closed' })
        }
      }}
    >
      {/* Hidden skip button for testing */}
      <YStack
        position="absolute"
        t={0}
        l={0}
        width={10}
        height={10}
        opacity={0}
        data-testid="skip-onboarding"
        onPress={() => finishOnboarding()}
        z={999999}
      />
      <DropAreaFrame>
        <AnimatedSteps animation="quickLessBouncy" total={3} current={stepNum}>
          {step === 'profile' ? (
            <>
              <Dialog.Header title="Profile" />
              <UserProfileEditForm
                onProfileComplete={handleProfileComplete}
                isOpen={show}
                customFooter={({ submitButton }) => (
                  <Dialog.Footer>
                    <XStack justify="flex-end" flex={1} gap="$3">
                      {submitButton}
                    </XStack>
                  </Dialog.Footer>
                )}
              />
            </>
          ) : step === 'notifications' ? (
            <>
              <Dialog.Header
                title="Enable notifications"
                description="To have notification banners appear on your desktop, you'll want to make sure Mac notifications settings are set to Alert."
              />

              <YStack gap="$6" px="$3">
                <YStack
                  borderColor="$color1"
                  borderWidth={0.5}
                  shadowRadius={10}
                  rounded="$4"
                  shadowColor="$shadow3"
                  shadowOffset={{ height: 4, width: 0 }}
                  mx="auto"
                  overflow="hidden"
                >
                  <Image
                    src={'/mac-notifications-guide.webp'}
                    height={240}
                    width={440}
                    objectFit="contain"
                    // scale up a bit so it always is outside frame (more flexibility)
                    scale={1.01}
                  />
                </YStack>
                <SizableText
                  size="$3"
                  color="$color10"
                  text="center"
                  pointerEvents="none"
                  select="none"
                >
                  Find it in System Settings → Notifications → start.chat
                </SizableText>
              </YStack>

              <Dialog.Footer>
                <XStack justify="flex-end" flex={1} gap="$3">
                  {isTauri && (
                    <ButtonAction
                      size="small"
                      theme="blue"
                      onPress={openSystemPreferences}
                    >
                      Open System Preferences
                    </ButtonAction>
                  )}
                  <ButtonAction size="small" onPress={handleNotificationsComplete}>
                    Continue
                  </ButtonAction>
                </XStack>
              </Dialog.Footer>
            </>
          ) : (
            <>
              <Dialog.Header
                title="Create Server"
                description="Set up your teams server:"
              />
              <CreateServerForm
                onComplete={handleServerComplete}
                customFooter={({ submitButton }) => (
                  <Dialog.Footer>
                    <XStack justify="space-between" flex={1} gap="$3">
                      <ButtonSimple onPress={() => setStep('profile')}>Back</ButtonSimple>
                      {submitButton}
                    </XStack>
                  </Dialog.Footer>
                )}
              />
            </>
          )}
        </AnimatedSteps>
      </DropAreaFrame>
    </Dialog>
  )
}
