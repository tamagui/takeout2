import * as FileSystem from 'expo-file-system/legacy'
import { requestMediaLibraryPermissionsAsync } from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import { showError } from '~/interface/dialogs/actions'
import { showToast } from '~/interface/toast/helpers'

/**
 * Save a remote image to the local device
 * This is a stub implementation - needs proper implementation for production
 */
export async function saveRemoteImage(imageUrl: string): Promise<boolean> {
  try {
    console.info('saveRemoteImage stub called with:', imageUrl)

    // Web implementation - download the image
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = imageUrl.split('/').pop() || 'image.jpg'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return true
    }

    // Native implementation
    showToast('Saving image to gallery...', {
      type: 'info',
      duration: 5000,
    })
    // Request permissions first
    const hasPermission = await requestMediaLibraryPermissionsAsync()
    if (!hasPermission) {
      return false
    }

    // Extract file extension from URL
    const fileExtension = extractFileExtension(imageUrl)
    const timestamp = Date.now()
    const localUri = `${FileSystem.documentDirectory}temp-image-${timestamp}.${fileExtension}`

    // Download the image using FileSystem
    const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri)

    console.info('downloadResult:', downloadResult)
    if (downloadResult.status !== 200) {
      throw new Error('Failed to download image')
    }

    // Save the downloaded image to gallery
    const asset = await saveImageToGallery(downloadResult.uri)

    // Clean up temporary file
    try {
      await FileSystem.deleteAsync(localUri, { idempotent: true })
    } catch (cleanupError) {
      console.info('Error cleaning up temp file:', cleanupError)
    }

    if (asset) {
      showToast('Image saved to gallery!', {
        type: 'success',
        duration: 2000,
      })
      return true
    } else {
      throw new Error('Failed to save image to gallery')
    }
  } catch (error) {
    console.info('Error saving remote image:', error)
    showError({
      error,
      title: 'Failed to Save Image',
    })
    return false
  }
}

/**
 * Save an image to the device's media library/gallery
 */
export const saveImageToGallery = async (
  uri: string
): Promise<MediaLibrary.Asset | null> => {
  try {
    const asset = await MediaLibrary.createAssetAsync(uri)
    return asset
  } catch (error) {
    console.info('Error saving image to gallery:', error)
    throw error
  }
}

/**
 * Helper to download image with CORS proxy if needed
 */
export async function saveRemoteImageWithProxy(
  imageUrl: string,
  proxyUrl?: string
): Promise<boolean> {
  const finalUrl = proxyUrl ? `${proxyUrl}${encodeURIComponent(imageUrl)}` : imageUrl
  return saveRemoteImage(finalUrl)
}

/**
 * Extract file extension from URL
 */
const extractFileExtension = (url: string): string => {
  const urlParts = url.split('?')[0] // Remove query params
  const pathParts = urlParts?.split('/')
  const filename = pathParts?.[pathParts.length - 1]

  if (filename && filename.includes('.')) {
    const ext = filename.split('.').pop()
    if (ext && ext.length <= 4) {
      return ext
    }
  }

  return 'jpg' // default extension
}
