import { Platform } from 'react-native'

// Re-export saveRemoteImage for compatibility
export { saveRemoteImage, saveRemoteImageWithProxy } from './saveRemoteImage'

export async function saveImageToDevice(imageUrl: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      // For web, download the image
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = 'image.jpg'
      link.click()
      return true
    }

    // Native image saving functionality removed
    console.warn('Native image saving not implemented')
    return false
  } catch (error) {
    console.error('Error saving image:', error)
    return false
  }
}
