import { router } from 'one'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatePresence, H5, View, YStack } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { registerDevice } from '~/features/notification'
import { notificationPromptStorage } from '~/features/notification/notificationPromptStorage'
import { Button } from '~/interface/buttons/Button'
import {
  NOTIFICATION_CARD_GAP,
  NOTIFICATION_CARD_HEIGHT,
  NotificationCard,
} from '~/interface/notification/NotificationCard'
import { PageLayout } from '~/interface/pages/PageLayout'

import type { NotificationItem } from '~/features/notification/types'

const notificationData: NotificationItem[] = [
  {
    id: '1',
    avatar: 'https://i.pravatar.cc/150?img=12',
    name: 'Ken Ronald',
    message: 'Sent you a message!',
    time: 'now',
  },
  {
    id: '2',
    avatar: 'https://i.pravatar.cc/150?img=33',
    name: 'You got paid! 🎉',
    message: '112 users bought your token',
    time: 'now',
  },
  {
    id: '3',
    avatar: 'https://i.pravatar.cc/150?img=47',
    name: 'Natalie Michaels',
    message: 'Sent you a message!',
    time: 'now',
  },
  {
    id: '4',
    avatar: 'https://i.pravatar.cc/150?img=68',
    name: 'Your token is trending 🔥',
    message: 'Check it now',
    time: 'now',
  },
  {
    id: '5',
    avatar: 'https://i.pravatar.cc/150?img=25',
    name: 'Luna Skies',
    message: 'Sent you a message!',
    time: 'now',
  },
]

export const NotificationPage = () => {
  const { top } = useSafeAreaInsets()
  const { user } = useAuth()

  const [showCards, setShowCards] = useState(false)
  const [isSpread, setIsSpread] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setShowCards(true), 300)
    const timer2 = setTimeout(() => setIsSpread(true), 1000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  const completeAndNavigate = () => {
    // mark as seen so we don't show again
    notificationPromptStorage.set(true)
    router.replace('/home')
  }

  const handleAllowNotifications = async () => {
    const result = await registerDevice(user?.id ?? '')
    if (result.success) {
      console.info('push token registered:', result.success)
    } else {
      console.info('notification registration failed:', result.error)
    }
    completeAndNavigate()
  }

  const handleSkip = () => {
    completeAndNavigate()
  }

  return (
    <PageLayout>
      <YStack px="$6" mb="$8" gap="$5" pt={top + 26}>
        <YStack opacity={1} x={0} enterStyle={{ opacity: 0, x: -20 }} transition="medium">
          <H5 size="$8" color="$color12" text="center">
            Notifications
          </H5>
        </YStack>
      </YStack>

      <View
        position="relative"
        flex={1}
        height={
          notificationData.length * (NOTIFICATION_CARD_HEIGHT + NOTIFICATION_CARD_GAP)
        }
      >
        <AnimatePresence>
          {showCards &&
            notificationData.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                index={index}
                isSpread={isSpread}
                totalCount={notificationData.length}
              />
            ))}
        </AnimatePresence>
      </View>

      <YStack
        px="$4"
        gap="$3"
        pb="$4"
        enterStyle={{ opacity: 0, y: 20 }}
        transition={['medium', { delay: 1800 }]}
      >
        <Button
          size="large"
          onPress={handleAllowNotifications}
          theme="accent"
          variant="action"
        >
          Allow Notifications
        </Button>

        <Button size="large" onPress={handleSkip} variant="transparent">
          <Button.Text color="$color11" opacity={0.8}>
            Not now
          </Button.Text>
        </Button>
      </YStack>
    </PageLayout>
  )
}
