import { createStorageValue } from '@take-out/helpers'

export const notificationPromptStorage = createStorageValue<boolean>(
  'hasSeenNotificationPrompt'
)
