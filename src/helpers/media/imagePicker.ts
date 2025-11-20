import * as ImagePicker from 'expo-image-picker'
import { Alert, Platform } from 'react-native'

// Type that matches expo-image-picker's return type
export type ImagePickerResult = ImagePicker.ImagePickerResult

export const pickImageFromLibrary = async (
  allowsEditing = true
): Promise<ImagePickerResult | null> => {
  // Web implementation using expo-image-picker
  if (Platform.OS === 'web') {
    // Expo image picker works on web too
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      return result
    }
    return null
  }

  // Native implementation
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

  if (!permissionResult.granted) {
    console.info('Permission to access media library was denied')
    Alert.alert(
      'Photo Access Required',
      'This feature requires photo access. You can enable it in your device settings.',
      [
        {
          text: 'OK',
          style: 'cancel',
        },
      ]
    )
    return null
  }

  // launch image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing,
    aspect: [1, 1],
    quality: 0.8,
    // Let iOS always convert image to compatible format e.g. HEIC to JPEG
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  })

  if (!result.canceled) {
    return result
  }

  return null
}

export const takePhotoWithCamera = async (
  allowsEditing = true
): Promise<ImagePickerResult | null> => {
  // Web doesn't support camera directly via expo-image-picker
  if (Platform.OS === 'web') {
    console.warn('Camera not supported on web')
    return pickImageFromLibrary(allowsEditing)
  }

  // request permission
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync()

  if (!permissionResult.granted) {
    console.info('Permission to access camera was denied')
    Alert.alert(
      'Camera Access Required',
      'This feature requires camera access. You can enable it in your device settings.',
      [
        {
          text: 'OK',
          style: 'cancel',
        },
      ]
    )
    return null
  }

  // launch camera
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing,
    aspect: [1, 1],
    quality: 0.8,
  })

  if (!result.canceled) {
    return result
  }

  return null
}
