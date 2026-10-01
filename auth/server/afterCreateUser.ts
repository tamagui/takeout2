import 'server-only'
import { DEMO_USER_ID } from '~/auth/demoIdentity'
import { db } from '~/database/db'
import { userPublic } from '~/database/schema'
import { captureSignupAnalytics } from '~/features/analytics/appAnalytics.server'

// When a private better-auth user is created, mirror minimal info to
// userPublic so it can be referenced from synced (zero) tables like post /
// comment. Auth and public data share the same application SQLite database.
export async function afterCreateUser(
  user: { id: string; email: string; name?: string | null; image?: string | null },
  installationId: string | null,
) {
  const usernameFromEmail = user.email
    ? user.email
        .split('@')[0]
        ?.toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
    : null

  await db.transaction(({ drizzle }) =>
    drizzle
      .insert(userPublic)
      .values({
        id: user.id,
        name: user.name ?? null,
        username: usernameFromEmail ?? null,
        image: user.image ?? null,
        joinedAt: Date.now(),
      })
      .onConflictDoNothing(),
  )
  await captureSignupAnalytics(installationId, user.id === DEMO_USER_ID)
}
