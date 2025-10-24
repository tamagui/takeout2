import jwt from 'jsonwebtoken'
import { APNS_TEAM_ID, APNS_KEY_ID, APNS_KEY } from '~/server/env-server'

/**
 * Generates a JWT token for Apple Push Notification service (APNs) token-based authentication.
 *
 * See: https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns
 */
export function getApnsToken() {
  if (!APNS_TEAM_ID || !APNS_KEY_ID || !APNS_KEY) {
    throw new Error(
      'Missing APNS environment variables, please make sure APNS_TEAM_ID, APNS_KEY_ID and APNS_KEY are set.'
    )
  }

  const token = jwt.sign(
    {
      iss: APNS_TEAM_ID,
      iat: Math.floor(Date.now() / 1000),
    },
    APNS_KEY,
    { header: { alg: 'ES256', kid: APNS_KEY_ID }, algorithm: 'ES256' }
  )

  return token
}
