import { Clipboard } from 'react-native'

export const getClipboardText = async (): Promise<string | null> => {
  try {
    const text = await Clipboard.getString()
    return text
  } catch {
    return null
  }
}
