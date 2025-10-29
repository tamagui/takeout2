import type { AuthData } from '~/features/auth/types'

export const userActions = {
  async onboardUser(tx: any, authData: AuthData, userId: string) {
    const user = await tx.query.userPublic.where('id', userId).one()
    if (user && !user.hasOnboarded) {
      await tx.mutate.userPublic.update({
        id: userId,
        hasOnboarded: true,
      })
      return true
    }
    return false
  },

  async validateUsername(tx: any, username: string) {
    if (!username || username.length < 3) {
      throw new Error('Username must be at least 3 characters')
    }

    if (username.length > 30) {
      throw new Error('Username must be less than 30 characters')
    }

    // Check if username matches allowed pattern (alphanumeric, underscore, hyphen)
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new Error(
        'Username can only contain letters, numbers, underscores, and hyphens'
      )
    }

    // Check if username is already taken
    const existingUser = await tx.query.userPublic.where('username', username).one()
    if (existingUser) {
      throw new Error('Username is already taken')
    }

    return true
  },

  async deleteAccount(tx: any, userId: string) {
    // Note: We cannot use .all() method, so we'll need to handle this differently
    // For now, just delete the user and let cascading deletes handle the rest
    // Or use a database trigger/stored procedure for cleanup

    // Delete user stats
    const userStats = await tx.query.userStats.where('id', userId).one()
    if (userStats) {
      await tx.mutate.userStats.delete({ id: userId })
    }

    // Delete user state
    const userState = await tx.query.userState.where('id', userId).one()
    if (userState) {
      await tx.mutate.userState.delete({ id: userId })
    }

    // Finally, delete the user
    await tx.mutate.userPublic.delete({ id: userId })
  },

  async whitelistUsers(tx: any, emails: string[]) {
    const now = Date.now()

    // For each email, create or update a privateBetaInvite
    for (const email of emails) {
      const existing = await tx.query.privateBetaInvite.where('email', email).one()
      if (!existing) {
        await tx.mutate.privateBetaInvite.insert({
          id: `invite_${now}_${Math.random().toString(36).substring(7)}`,
          email,
          createdAt: now,
          accepted: false,
        })
      }
    }

    // Also mark any existing users with these emails as whitelisted
    for (const email of emails) {
      const user = await tx.query.userPublic.where('email', email).one()
      if (user) {
        await tx.mutate.userPublic.update({
          id: user.id,
          whitelisted: true,
        })
      }
    }
  },
}
