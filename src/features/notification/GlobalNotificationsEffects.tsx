import { memo, useEffect, useState } from 'react'
import type { NotificationSchedule } from 'start/types'
import { formatMentionsToText } from '~/features/message/formatMentionsToText'
import { sleep } from '@vxrn/helpers'
import { useAsyncEffect } from '@vxrn/helpers'
import { ensure } from '@vxrn/helpers'
import { ellipsis } from '@vxrn/helpers'
import { useLatestNotifications } from '~/interface/activity/useLatestNotifications'
import { isTauri } from '@vxrn/helpers'
import { useUserState } from '../user/userState'

export const GlobalNotificationsEffects = memo(() => {
  const { notifications, isLoading } = useLatestNotifications()
  const settings = useUserState('settings')
  const preference = settings.notifications

  // we don't want to send a notification every time the app starts
  // we can just let the badges do the work
  // for sounds, we start them only for newly incoming notifications
  // since the user loaded the app
  const [notifyAfter, setNotifyAfter] = useState<number | null>(null)

  useEffect(() => {
    if (isTauri && preference !== 'none') {
      import('@tauri-apps/plugin-notification').then(({ requestPermission }) => {
        requestPermission().catch(console.warn)
      })
    }
  }, [preference])

  useAsyncEffect(
    async (signal) => {
      ensure(!isLoading)
      ensure(preference !== 'none')

      if (
        settings.notificationSchedule &&
        !isWithinAllowedSchedule([...settings.notificationSchedule], settings.timezone)
      ) {
        console.info('[notification] skipping, outside allowed schedule')
        return
      }

      if (notifyAfter === null) {
        // zero can return partial results, give it a sec
        await sleep(500, signal)
        const initialNotifyAfter = notifications.length
          ? notifications[0]?.createdAt || 0
          : 0

        setNotifyAfter(initialNotifyAfter)
      } else {
        for (const notification of notifications) {
          if (notification.createdAt <= notifyAfter) {
            // old
            return
          }

          console.info(`[notification] sending notification`, {
            notifyAfter,
            notifications,
            settings,
          })

          // we found a notification after the last one
          if (!settings.notificationSoundDisabled) {
            playNotificationSound(settings.notificationSound || 'bell')
          }

          const message = notification.messages?.[0]

          if (isTauri && message) {
            const messageText = message.content
              ? formatMentionsToText(message.content)
              : 'sent a message'

            const title = `${message.creator?.username} in #${message.channel?.name}`

            sendTauriNotification(title, ellipsis(messageText, 100))
          }

          setNotifyAfter(notification.createdAt)
          return
        }
      }
    },
    [notifications, preference, settings]
  )

  return null
})

async function sendTauriNotification(
  title: string,
  body: string,
  icon?: string
): Promise<void> {
  if (!isTauri) return

  try {
    const { sendNotification, isPermissionGranted, requestPermission } = await import(
      '@tauri-apps/plugin-notification'
    )

    let permissionGranted = await isPermissionGranted()

    if (!permissionGranted) {
      const permission = await requestPermission()
      permissionGranted = permission === 'granted'
    }

    if (permissionGranted) {
      sendNotification({
        title,
        body,
        icon,
      })
    }
  } catch (error) {
    console.warn('Failed to send Tauri notification:', error)
  }
}

const audioCache: Record<string, HTMLAudioElement> = {}

function playNotificationSound(sound: string = 'bell') {
  const soundMap: Record<string, string> = {
    bell: '/sounds/click.mp3',
    chime: '/sounds/click.mp3', // Using click.mp3 as placeholder
    pop: '/sounds/click.mp3', // Using click.mp3 as placeholder
    ding: '/sounds/click.mp3', // Using click.mp3 as placeholder
    select: '/sounds/select.wav',
    tap: '/sounds/tap_03.wav',
    type: '/sounds/type_01.wav',
  }

  const soundFile = soundMap[sound] || '/sounds/click.mp3'

  if (!audioCache[soundFile]) {
    audioCache[soundFile] = new Audio(soundFile)
    audioCache[soundFile].volume = 0.1
  }

  audioCache[soundFile].play().catch((error) => {
    console.warn('[playNotificationSound] Failed to play notification sound:', error)
  })
}

function isWithinAllowedSchedule(
  schedules: NotificationSchedule[],
  timezone?: string
): boolean {
  if (!schedules || schedules.length === 0) return true // If no schedule set, always allow

  const now = new Date()
  const currentDay = now
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toLowerCase()
    .substring(0, 3)
  const currentTime = now.toTimeString().substring(0, 5) // HH:MM format

  const isWeekday = ['mon', 'tue', 'wed', 'thu', 'fri'].includes(currentDay)
  const isWeekend = ['sat', 'sun'].includes(currentDay)

  return schedules.some((schedule) => {
    // Check if current day matches schedule
    let dayMatches = false
    if (schedule.days === currentDay) {
      dayMatches = true
    } else if (schedule.days === 'weekdays' && isWeekday) {
      dayMatches = true
    } else if (schedule.days === 'weekend' && isWeekend) {
      dayMatches = true
    }

    if (!dayMatches) return false

    // Check if current time is within allowed schedule
    return currentTime >= schedule.from && currentTime <= schedule.to
  })
}
