import { Directory, File, Paths } from 'expo-file-system'
import { requestMediaLibraryPermissionsAsync } from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'

import { showError } from '~/interface/dialogs/actions'
import { showToast } from '~/interface/toast/helpers'

/**
 * Save a remote image to the local device (native implementation)
 */
export async function saveRemoteImage(imageUrl: string): Promise<boolean> {
  try {
    console.info('saveRemoteImage called with:', imageUrl)

    showToast('Saving image to gallery...', {
      type: 'info',
      duration: 5000,
    })

    // request permissions first
    const hasPermission = await requestMediaLibraryPermissionsAsync()
    if (!hasPermission) {
      return false
    }

    // download the image using the new File API to the cache directory
    const file = await File.downloadFileAsync(imageUrl, new Directory(Paths.cache))

    console.info('downloadResult:', file.uri)

    // save the downloaded image to gallery
    const asset = await saveImageToGallery(file.uri)

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
