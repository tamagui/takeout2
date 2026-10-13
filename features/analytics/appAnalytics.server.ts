import 'server-only'
import { sendAppSignupEvent } from 'takeout-better-auth/analytics/server'

export async function captureSignupAnalytics(installationId: string | null, isDemo: boolean) {
  await sendAppSignupEvent(installationId, isDemo, {
    endpoint: process.env.APP_ANALYTICS_URL,
    token: process.env.APP_ANALYTICS_TOKEN,
  })
}
