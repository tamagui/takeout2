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

    // Native implementation would go here
    // For now, just log and return false
    console.warn('saveRemoteImage: Native implementation not available')
    return false
  } catch (error) {
    console.error('Error saving remote image:', error)
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
