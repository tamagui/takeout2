import { ArchiveIcon } from '~/interface/icons/phosphor/ArchiveIcon'
import { FileCsvIcon } from '~/interface/icons/phosphor/FileCsvIcon'
import { FileIcon } from '~/interface/icons/phosphor/FileIcon'
import { FileImageIcon } from '~/interface/icons/phosphor/FileImageIcon'
import { FileJsIcon } from '~/interface/icons/phosphor/FileJsIcon'
import { FileTextIcon } from '~/interface/icons/phosphor/FileTextIcon'
import { FileVideoIcon } from '~/interface/icons/phosphor/FileVideoIcon'
import { FileXIcon } from '~/interface/icons/phosphor/FileXIcon'

import {
  MAX_DOCUMENT_FILE_SIZE,
  MAX_FILE_SIZE,
  MAX_IMAGE_FILE_SIZE,
  MAX_VIDEO_FILE_SIZE,
  SUPPORTED_FILE_EXTENSIONS,
} from './types'

import type { AttachmentType } from './types'

export function getFileType(filename: string): AttachmentType {
  const ext = filename.toLowerCase().split('.').pop()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg' as const
    case 'png':
      return 'image/png' as const
    case 'gif':
      return 'image/gif' as const
    case 'webp':
      return 'image/webp' as const
    case 'txt':
      return 'text/plain' as const
    case 'json':
      return 'application/json' as const
    case 'md':
    case 'mdx':
      return 'text/markdown' as const
    case 'zip':
      return 'application/zip' as const
    case 'xls':
      return 'application/vnd.ms-excel' as const
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' as const
    case 'pdf':
      return 'application/pdf' as const
    case 'mp4':
      return 'video/mp4' as const
    case 'webm':
      return 'video/webm' as const
    case 'mov':
      return 'video/quicktime' as const
    default:
      return 'application/octet-stream' as const
  }
}

export function isImageFile(filename: string): boolean {
  if (filename.startsWith('data:image')) {
    return true
  }
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  return imageExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
}

export function isVideoFile(filename: string): boolean {
  if (filename.startsWith('data:video')) {
    return true
  }
  const videoExtensions = ['.mp4', '.webm', '.mov']
  return videoExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
}

export function isSupportedFile(filename: string): boolean {
  return SUPPORTED_FILE_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext))
}

export function validateFileSize(file: File): { valid: boolean; error?: string } {
  const filename = file.name
  let maxSize = MAX_FILE_SIZE
  let fileType = 'file'

  if (isVideoFile(filename)) {
    maxSize = MAX_VIDEO_FILE_SIZE
    fileType = 'video'
  } else if (isImageFile(filename)) {
    maxSize = MAX_IMAGE_FILE_SIZE
    fileType = 'image'
  } else {
    maxSize = MAX_DOCUMENT_FILE_SIZE
    fileType = 'file'
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} size exceeds the maximum limit of ${(maxSize / (1024 * 1024)).toFixed(0)}MB`,
    }
  }
  return { valid: true }
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file extension
  if (!isSupportedFile(file.name)) {
    return {
      valid: false,
      error: `File type not supported. Supported types: ${SUPPORTED_FILE_EXTENSIONS.join(', ')}`,
    }
  }

  // Check file size
  const sizeValidation = validateFileSize(file)
  if (!sizeValidation.valid) {
    return sizeValidation
  }

  return { valid: true }
}

export function getFileIcon(filename: string, size?: number) {
  const ext = filename.toLowerCase().split('.').pop()
  const iconProps = { size: size || 16 }

  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return <FileImageIcon {...iconProps} />
    case 'txt':
    case 'md':
    case 'mdx':
      return <FileTextIcon {...iconProps} />
    case 'json':
      return <FileJsIcon {...iconProps} />
    case 'zip':
      return <ArchiveIcon {...iconProps} />
    case 'xls':
    case 'xlsx':
      return <FileCsvIcon {...iconProps} />
    case 'pdf':
      return <FileIcon {...iconProps} />
    case 'mp4':
    case 'webm':
    case 'mov':
      return <FileVideoIcon {...iconProps} />
    default:
      return <FileXIcon {...iconProps} />
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}
