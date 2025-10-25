import * as MediaLibrary from 'expo-media-library'
import { Alert, Platform } from 'react-native'

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

    // Request permission to save to media library
    const { status } = await MediaLibrary.requestPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to save images')
      return false
    }

    // Save the image
    await MediaLibrary.saveToLibraryAsync(imageUrl)
    Alert.alert('Success', 'Image saved to gallery')
    return true
  } catch (error) {
    console.error('Error saving image:', error)
    Alert.alert('Error', 'Failed to save image')
    return false
  }
}
