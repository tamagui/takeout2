// web stub - these functions are never called on web
// web uses native file inputs instead

export type ImagePickerResult = {
  canceled: boolean
  assets?: Array<{
    uri: string
    fileName?: string
    mimeType?: string
    type?: string
    fileSize?: number
  }>
}

export const pickImageFromLibrary = async (
  _allowsEditing = true
): Promise<ImagePickerResult | null> => {
  // never called on web - web uses native file input
  console.warn('pickImageFromLibrary called on web - this should not happen')
  return null
}

export const takePhotoWithCamera = async (
  _allowsEditing = true
): Promise<ImagePickerResult | null> => {
  // never called on web
  console.warn('takePhotoWithCamera called on web - this should not happen')
  return null
}
