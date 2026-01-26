import { Alert } from 'react-native'

export interface AlertButton {
  text: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

export interface AlertOptions {
  title: string
  message?: string
  buttons?: AlertButton[]
}

export const alertController = {
  show: (options: AlertOptions) => {
    const { title, message, buttons = [{ text: 'OK' }] } = options

    if (!process.env.VITE_NATIVE) {
      // For web, use browser alert/confirm
      if (buttons.length === 1) {
        window.alert(message ? `${title}\n\n${message}` : title)
        buttons[0]?.onPress?.()
      } else {
        const confirmed = window.confirm(message ? `${title}\n\n${message}` : title)
        if (confirmed) {
          const confirmButton = buttons.find((b) => b.style !== 'cancel')
          confirmButton?.onPress?.()
        } else {
          const cancelButton = buttons.find((b) => b.style === 'cancel')
          cancelButton?.onPress?.()
        }
      }
    } else {
      Alert.alert(title, message, buttons)
    }
  },

  confirm: (
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    alertController.show({
      title,
      message,
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'OK',
          onPress: onConfirm,
        },
      ],
    })
  },

  alert: (title: string, message?: string, onPress?: () => void) => {
    alertController.show({
      title,
      message,
      buttons: [{ text: 'OK', onPress }],
    })
  },
}
