import { forwardFeedback } from 'takeout-native/feedback/server'
import type { Endpoint } from 'one'

// the device talks only to its own app. this server route replaces every
// caller-controlled header with the deployment's feedback token before
// forwarding the bounded report to APP_FEEDBACK_URL.
export const POST: Endpoint = (request) =>
  forwardFeedback(request, {
    endpoint: process.env.APP_FEEDBACK_URL,
    token: process.env.APP_FEEDBACK_TOKEN,
  })
