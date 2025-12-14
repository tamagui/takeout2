import { showError } from '~/interface/dialogs/actions'

/**
 * Save a remote image to the local device (web implementation)
 */
export async function saveRemoteImage(imageUrl: string): Promise<boolean> {
  try {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = imageUrl.split('/').pop() || 'image.jpg'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
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
 * Helper to download image with CORS proxy if needed
 */
export async function saveRemoteImageWithProxy(
  imageUrl: string,
  proxyUrl?: string
): Promise<boolean> {
  const finalUrl = proxyUrl ? `${proxyUrl}${encodeURIComponent(imageUrl)}` : imageUrl
  return saveRemoteImage(finalUrl)
}
