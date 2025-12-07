import { S3Client } from '@aws-sdk/client-s3'

import {
  CLOUDFLARE_R2_ENDPOINT,
  CLOUDFLARE_R2_ACCESS_KEY,
  CLOUDFLARE_R2_SECRET_KEY,
} from '~/server/env-server'

import type { S3Config } from './types'

export const defaultConfig: S3Config = {
  endpoint: CLOUDFLARE_R2_ENDPOINT,
  region: 'auto',
  forcePathStyle: true,
  accessKeyId: CLOUDFLARE_R2_ACCESS_KEY,
  secretAccessKey: CLOUDFLARE_R2_SECRET_KEY,
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
