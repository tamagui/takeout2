import type { AuthData } from '~/data/types'

export const userActions = {
  /**
   * Complete user onboarding after signup
   */
  async onboardUser(tx: any, authData: AuthData, userId: string) {
    // Mark user as onboarded
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

  /**
   * Validate username is unique and meets requirements
   */
  async validateUsername(tx: any, username: string) {
    // Basic validation
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

  /**
   * Delete user account and associated data
   */
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

    // TODO: In a production app, you would want to:
    // - Delete user's posts, follows, blocks, etc.
    // - This should ideally be done via a database trigger or stored procedure
    // - Or by querying and deleting in batches
  },

  /**
   * Whitelist users by email for private beta access
   */
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

  async updateUserStats(
    tx: any,
    userId: string,
    updates: Partial<{
      postsCount: number
      followersCount: number
      followingCount: number
    }>
  ) {
    const currentStats = await tx.query.userStats.where('id', userId).one()

    if (!currentStats) {
      // Create stats if they don't exist
      await tx.mutate.userStats.insert({
        id: userId,
        postsCount: updates.postsCount || 0,
        followersCount: updates.followersCount || 0,
        followingCount: updates.followingCount || 0,
        totalLikes: 0,
        updatedAt: Date.now(),
      })
    } else {
      // Update existing stats
      await tx.mutate.userStats.update({
        id: userId,
        ...updates,
      })
    }
  },

  async incrementPostCount(tx: any, userId: string) {
    const stats = await tx.query.userStats.where('id', userId).one()

    if (stats) {
      await tx.mutate.userStats.update({
        id: userId,
        postsCount: stats.postsCount + 1,
      })
    } else {
      await tx.mutate.userStats.insert({
        id: userId,
        postsCount: 1,
        followersCount: 0,
        followingCount: 0,
        totalLikes: 0,
        updatedAt: Date.now(),
      })
    }
  },

  async decrementPostCount(tx: any, userId: string) {
    const stats = await tx.query.userStats.where('id', userId).one()

    if (stats && stats.postsCount > 0) {
      await tx.mutate.userStats.update({
        id: userId,
        postsCount: stats.postsCount - 1,
      })
    }
  },
}
