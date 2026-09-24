import { createStorageValue } from '@o/helpers'

export const notificationPromptStorage = createStorageValue<boolean>(
  'hasSeenNotificationPrompt',
)
