import type { S3ClientConfig } from '@aws-sdk/client-s3'
import type { StreamingBlobPayloadInputTypes } from '@smithy/types'

export interface S3Config extends Partial<S3ClientConfig> {
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string
  region?: string
  forcePathStyle?: boolean
}

export interface UploadParams {
  bucket: string
  key: string
  body: StreamingBlobPayloadInputTypes
  contentType?: string
  folder?: string
}

export interface UploadResult {
  key: string
  url: string
}
