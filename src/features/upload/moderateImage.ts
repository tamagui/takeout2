import {
  RekognitionClient,
  DetectModerationLabelsCommand,
  type ModerationLabel,
} from '@aws-sdk/client-rekognition'

import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '~/server/env-server'

// rekognition client - use us-east-1 as it has best availability
const rekognition = new RekognitionClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID || '',
    secretAccessKey: AWS_SECRET_ACCESS_KEY || '',
  },
})

// categories we want to block
const BLOCKED_CATEGORIES = [
  'Explicit Nudity',
  'Violence',
  'Visually Disturbing',
  'Hate Symbols',
]

// minimum confidence to trigger a block
const MIN_CONFIDENCE = 70

export type ModerationResult = {
  safe: boolean
  blockedLabels: ModerationLabel[]
  allLabels: ModerationLabel[]
}

/**
 * moderate an image using AWS Rekognition
 * returns whether the image is safe and any detected moderation labels
 */
export async function moderateImage(imageBytes: Uint8Array): Promise<ModerationResult> {
  // skip if no credentials configured
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.warn('[moderateImage] AWS credentials not configured, skipping moderation')
    return { safe: true, blockedLabels: [], allLabels: [] }
  }

  try {
    const command = new DetectModerationLabelsCommand({
      Image: { Bytes: imageBytes },
      MinConfidence: MIN_CONFIDENCE,
    })

    const response = await rekognition.send(command)
    const labels = response.ModerationLabels || []

    // check if any blocked category was detected
    const blockedLabels = labels.filter((label) => {
      const parentName = label.ParentName || ''
      const labelName = label.Name || ''
      return BLOCKED_CATEGORIES.some(
        (cat) => parentName.includes(cat) || labelName.includes(cat)
      )
    })

    return {
      safe: blockedLabels.length === 0,
      blockedLabels,
      allLabels: labels,
    }
  } catch (error) {
    console.error('[moderateImage] Rekognition error:', error)
    // fail open - allow image if moderation service fails
    // in production you might want to fail closed instead
    return { safe: true, blockedLabels: [], allLabels: [] }
  }
}

/**
 * moderate an image from a URL
 */
export async function moderateImageFromUrl(imageUrl: string): Promise<ModerationResult> {
  try {
    const response = await fetch(imageUrl)
    const arrayBuffer = await response.arrayBuffer()
    return moderateImage(new Uint8Array(arrayBuffer))
  } catch (error) {
    console.error('[moderateImageFromUrl] fetch error:', error)
    return { safe: true, blockedLabels: [], allLabels: [] }
  }
}
