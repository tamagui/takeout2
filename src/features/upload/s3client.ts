import { S3Client } from '@aws-sdk/client-s3'

import { server } from '~/env'

import type { S3Config } from './types'

export const defaultConfig: S3Config = {
  endpoint: server.CLOUDFLARE_R2_ENDPOINT,
  region: 'auto',
  forcePathStyle: true,
  accessKeyId: server.CLOUDFLARE_R2_ACCESS_KEY,
  secretAccessKey: server.CLOUDFLARE_R2_SECRET_KEY,
}

export const createS3Client = (config: S3Config = {}) => {
  const finalConfig = {
    ...defaultConfig,
    ...config,
    credentials: {
      accessKeyId: config.accessKeyId ?? defaultConfig.accessKeyId ?? '',
      secretAccessKey: config.secretAccessKey ?? defaultConfig.secretAccessKey ?? '',
    },
  }

  if (!finalConfig.credentials.accessKeyId || !finalConfig.credentials.secretAccessKey) {
    throw new Error('Missing required AWS credentials')
  }

  return new S3Client(finalConfig)
}

export const s3Client = createS3Client()
