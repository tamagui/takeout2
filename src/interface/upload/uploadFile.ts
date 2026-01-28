import { AbortError, createGlobalContext, isWeb, useAsyncEffect } from '@take-out/helpers'
import { useContext, useEffect, useState } from 'react'
import { useEvent } from 'tamagui'

import { SERVER_URL } from '~/constants/urls'

import { getFileType, isImageFile, isVideoFile, validateFile } from './helpers'
import { prepareImageForUpload } from './resizeImage'

import type { FileUpload } from './types'
import type React from 'react'

interface UploadResponse {
  url?: string
  error?: string
  thumbnail?: string | null
}

export const uploadEndpoint = `${SERVER_URL}/api/file/upload`

export function uploadFileData(
  fileData: File | Blob,
  onProgress: (percent: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', fileData)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', uploadEndpoint)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded * 100) / event.total)
        onProgress(percentage)
      }
    }

    xhr.onload = () => {
      try {
        const response: UploadResponse = JSON.parse(xhr.response)
        if (xhr.status === 200) {
          resolve(response)
        } else {
          // parse error from response body (e.g., moderation failures return 400)
          reject(new Error(response.error || `Upload failed with status: ${xhr.status}`))
        }
      } catch (e) {
        reject(new Error('Failed to parse server response.', { cause: e }))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Upload error: An error occurred while uploading the file.'))
    }

    xhr.send(formData)
  })
}

type UploadFilesContextType = {
  uploads: FileUpload[]
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleUpload: (files: File[]) => void
}

export type UploadFilesCallback = (uploads: FileUpload[]) => void

const context = createGlobalContext<UploadFilesContextType | null>('upload/files', null)

export const ProvideUploadFiles = context.Provider

export const useParentUploadFiles = () => {
  const ctx = useContext(context)
  if (!ctx) {
    throw new Error('useParentUploadFiles must be used within ProvideUploadFiles')
  }
  return ctx
}

const defaultResize = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 1,
  maxSizeInBytes: 1024 * 1024,
}

export const useUploadFiles = ({
  onChange,
  resize = defaultResize,
}: {
  onChange?: UploadFilesCallback
  resize?: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    maxSizeInBytes?: number
  }
}) => {
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [uploadsToProcess, setUploadsToProcess] = useState<FileUpload[]>([])
  const onChangeEvent = useEvent(onChange)

  useEffect(() => {
    onChangeEvent?.(uploads)
  }, [uploads, onChangeEvent])

  const clear = () => {
    setUploads([])
    setUploadsToProcess([])
  }

  const getFileId = (file: File) =>
    `${file.name}-${file.type}-${file.lastModified}-${file.size}`

  const handleUpload = (files: File[]) => {
    const fakeEvent = {
      target: {
        files,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    handleFileChange(fakeEvent)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) {
      setUploads([])
      setUploadsToProcess([])
      return
    }

    function getUpload(upload: File): FileUpload {
      const validation = validateFile(upload)
      // check if it's a native pseudo-file with uri property
      const isNativeFile = !isWeb && typeof (upload as any).uri === 'string'
      return {
        uid: getFileId(upload),
        name: upload.name,
        type: getFileType(upload.type || upload.name),
        file: upload,
        size: upload.size,
        progress: 0,
        ...(validation.valid
          ? {
              status: 'uploading' as const,
              preview:
                isImageFile(upload.name) || isVideoFile(upload.name)
                  ? isNativeFile
                    ? (upload as any).uri // use uri for native
                    : URL.createObjectURL(upload) // use blob url for web
                  : undefined,
            }
          : {
              status: 'error',
              error: validation.error,
            }),
      }
    }

    const newUploads = files.map(getUpload)
    setUploads(newUploads)
    const toProcess = newUploads.filter((u) => u.status === 'uploading' && u.file)
    setUploadsToProcess(toProcess)
  }

  useAsyncEffect(
    async (signal) => {
      if (uploadsToProcess.length === 0) return

      const updateFile = (uid: string, updates: Partial<FileUpload>) => {
        if (signal.aborted) {
          throw new AbortError('Operation aborted')
        }

        setUploads((current) =>
          current.map((u) => (u.uid === uid ? { ...u, ...updates } : u))
        )
      }

      for (const upload of uploadsToProcess) {
        if (signal.aborted) break

        try {
          let processedFile: File | Blob = upload.file!

          if (isImageFile(upload.name)) {
            processedFile = await prepareImageForUpload(upload, resize)
          }

          if (signal.aborted) throw new AbortError('Upload cancelled')

          const response = await uploadFileData(processedFile, (progress) => {
            updateFile(upload.uid, { progress, status: 'uploading' })
          })

          if (signal.aborted) throw new AbortError('Upload cancelled')

          if (response.url) {
            updateFile(upload.uid, {
              url: response.url,
              thumbnail: response.thumbnail,
              status: 'complete',
            })
          } else {
            updateFile(upload.uid, {
              error: response.error,
              status: 'error',
            })
          }
        } catch (err) {
          if (err instanceof AbortError) {
            console.info('Upload aborted')
            break
          }

          updateFile(upload.uid, {
            error: err instanceof Error ? err.message : `${err}`,
            status: 'error',
          })
        }
      }
    },
    [uploadsToProcess, JSON.stringify(resize)]
  )

  return {
    uploads,
    handleUpload,
    handleFileChange,
    clear,
  }
}
