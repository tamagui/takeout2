import * as Clipboard from 'expo-clipboard'

export const getClipboardText = async (): Promise<string | null> => {
  try {
    const text = await Clipboard.getStringAsync()
    return text
  } catch {
    return null
  }
}
