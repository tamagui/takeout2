import { configureFeedback } from 'contrast-native/feedback'
import { APP_NAME, APP_SCHEME, SERVER_URL } from '~/constants'
import { isFeedbackSettingEnabled, subscribeToFeedbackSetting } from './feedbackSetting'
import type { FeedbackReport } from 'contrast-native/feedback'

// three-finger tap opens the overlay on any screen. the report is delivered by
// this app's own submit function, so the overlay itself never learns an origin,
// a header, or an account.
function applyConfiguration() {
  configureFeedback({
    // this is descriptive app identity, never a project routing credential.
    // the server-only deployment capability decides the owning workspace.
    app: { id: APP_SCHEME, name: APP_NAME },
    enabled: isFeedbackSettingEnabled(),
    submit: sendFeedbackReport,
  })
}

async function sendFeedbackReport(report: FeedbackReport) {
  const response = await fetch(`${SERVER_URL}/api/feedback`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(report),
  })
  if (response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const id =
      body && typeof body === 'object' && 'id' in body && typeof body.id === 'string'
        ? body.id
        : undefined
    return { ok: true as const, id }
  }
  const body: unknown = await response.json().catch(() => null)
  const detail =
    body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
      ? body.error
      : `Could not send feedback (${response.status})`
  return { ok: false as const, message: detail }
}

applyConfiguration()
subscribeToFeedbackSetting(applyConfiguration)
