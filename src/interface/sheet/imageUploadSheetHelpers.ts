import { createRef } from 'react'
import { Keyboard } from 'react-native'
import type { ImageUploadSheetRef } from './ImageUploadSheet'

// Global ref for the avatar upload sheet
export const imageUploadSheetRef = createRef<ImageUploadSheetRef>()

// Helper function to show avatar upload sheet from anywhere
export const showImageUploadSheet = (
  onImageSelected: (imageUri: string, imageData: any) => void,
  allowsEditing = true
) => {
  imageUploadSheetRef.current?.show(onImageSelected, allowsEditing)

  // Ensure any focused TextInput is blurred so the keyboard doesn't cover the sheet
  Keyboard.dismiss()
}

// Helper function to hide avatar upload sheet
export const hideImageUploadSheet = () => {
  imageUploadSheetRef.current?.hide()
}
