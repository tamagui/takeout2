import type { MutatorContext } from 'over-zero'

export const userActions = {
  async updateUserStats(
    ctx: MutatorContext,
    userId: string,
    updates: Partial<{
      postsCount: number
      followersCount: number
      followingCount: number
    }>
  ) {
    const { tx } = ctx

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

  async incrementPostCount(ctx: MutatorContext, userId: string) {
    const { tx } = ctx
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

  async decrementPostCount(ctx: MutatorContext, userId: string) {
    const { tx } = ctx
    const stats = await tx.query.userStats.where('id', userId).one()

    if (stats && stats.postsCount > 0) {
      await tx.mutate.userStats.update({
        id: userId,
        postsCount: stats.postsCount - 1,
      })
    }
  },
}
