// Image picker helper for web and native
// This is a simplified version - in production, you'd use expo-image-picker or similar

export interface ImagePickerResult {
  uri: string
  width?: number
  height?: number
  type?: string
}

export async function pickImageFromLibrary(): Promise<ImagePickerResult | null> {
  // Web implementation
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'

      input.onchange = (event: any) => {
        const file = event.target?.files?.[0]
        if (!file) {
          resolve(null)
          return
        }

        const uri = URL.createObjectURL(file)
        resolve({ uri, type: file.type })
      }

      input.click()
    })
  }

  // Native would use expo-image-picker
  console.warn('Image picker not implemented for this platform')
  return null
}

export async function takePhoto(): Promise<ImagePickerResult | null> {
  // This would use camera on native
  console.warn('Camera not implemented for this platform')
  return null
}

export async function takePhotoWithCamera(): Promise<ImagePickerResult | null> {
  // This would use camera on native
  console.warn('Camera not implemented for this platform')
  return null
}

// Alias for compatibility
export const launchImageLibrary = pickImageFromLibrary
