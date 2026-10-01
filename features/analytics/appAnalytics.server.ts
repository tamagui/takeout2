import 'server-only'
import { sendAppSignupEvent } from 'contrast-better-auth/analytics/server'

export async function captureSignupAnalytics(installationId: string | null, isDemo: boolean) {
  await sendAppSignupEvent(installationId, isDemo, {
    endpoint: process.env.CONTRAST_ANALYTICS_URL,
    token: process.env.CONTRAST_ANALYTICS_TOKEN,
  })
}
