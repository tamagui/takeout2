import { forwardContrastFeedback } from 'contrast-native/feedback/server'
import type { Endpoint } from 'one'

// the device talks only to its own app. this server route replaces every
// caller-controlled header with the deployment's project-scoped write
// capability before forwarding the bounded report to contrast.
export const POST: Endpoint = (request) =>
  forwardContrastFeedback(request, {
    endpoint: process.env.CONTRAST_FEEDBACK_URL,
    token: process.env.CONTRAST_FEEDBACK_TOKEN,
  })
