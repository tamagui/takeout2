import { Linking } from 'react-native'

export interface OpenCheckoutReturn {
  openCheckout: (url: string) => void
}

// opens stripe checkout in the browser (works on both web and native via Linking)
export function useOpenCheckout(): OpenCheckoutReturn {
  return {
    openCheckout: (url: string): void => {
      Linking.openURL(url)
    },
  }
}
