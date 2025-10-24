import type { AttachmentType } from 'start/data'

export type FileUpload = {
  uid: string
  name: string
  progress: number
  file: File
  type: AttachmentType
  size: number
  // uploaded url
  url?: string
  // data-uri string (mainly for images)
  preview?: string
  // video thumbnail data-uri
  thumbnail?: string | null
  error?: string
  status: 'uploading' | 'complete' | 'error'
}

// File size limits
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB in bytes
export const MAX_FILE_SIZE_DISPLAY = '100MB'
export const MAX_VIDEO_FILE_SIZE = 100 * 1024 * 1024 // 100MB for videos
export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024 // 10MB for images
export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024 // 10MB for documents

export const SUPPORTED_FILE_EXTENSIONS = [
  // Images
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  // Videos
  '.mp4',
  '.webm',
  '.mov',
  // Text
  '.txt',
  '.json',
  '.md',
  '.mdx',
  // Archives
  '.zip',
  // Spreadsheets
  '.xls',
  '.xlsx',
  // PDF
  '.pdf',
] as const
