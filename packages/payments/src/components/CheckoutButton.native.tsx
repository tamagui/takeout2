import * as WebBrowser from 'expo-web-browser'

export interface OpenCheckoutReturn {
  openCheckout: (url: string) => void
}

// opens stripe checkout in an in-app browser on native
export function useOpenCheckout(): OpenCheckoutReturn {
  return {
    openCheckout: (url: string): void => {
      void WebBrowser.openBrowserAsync(url, {
        dismissButtonStyle: 'close',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      })
    },
  }
}
