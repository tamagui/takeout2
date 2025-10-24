import type { FileUpload } from './types'

interface ImageDimensions {
  width: number
  height: number
}

interface ResizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeInBytes?: number
}

export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        width: img.width,
        height: img.height,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

export function resizeImage(file: File, options: ResizeOptions = {}): Promise<Blob> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width))
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height))
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create image blob'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

export async function shouldResizeImage(
  file: File,
  options: ResizeOptions = {}
): Promise<boolean> {
  const { maxWidth = 1200, maxHeight = 1200, maxSizeInBytes = 1024 * 1024 } = options

  if (file.size > maxSizeInBytes) {
    return true
  }

  try {
    const dimensions = await getImageDimensions(file)
    return dimensions.width > maxWidth || dimensions.height > maxHeight
  } catch (error) {
    console.warn('Error getting image dimensions:', error)
    return false
  }
}

export async function processImageForUpload(
  file: File,
  options: ResizeOptions = {}
): Promise<File | Blob> {
  if (!file.type.match(/^image\/(jpeg|png|webp)/)) {
    return file
  }

  try {
    const needsResize = await shouldResizeImage(file, options)

    if (needsResize) {
      const resizedBlob = await resizeImage(file, options)
      return resizedBlob
    }

    return file
  } catch (error) {
    console.warn('Image processing failed, using original:', error)
    return file
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1073741824).toFixed(1) + ' GB'
}

export async function prepareImageForUpload(
  upload: FileUpload,
  options: ResizeOptions = {}
): Promise<File | Blob> {
  if (!upload.type?.startsWith('image')) {
    return upload.file
  }
  return processImageForUpload(upload.file, options)
}
