import { AppError } from '@o/helpers'
import { mutations, serverWhere, zql } from 'on-zero'

import { checkProfanity } from '~/features/moderation/profanityFilter'

import type { Post } from '../types'

const permissions = serverWhere('post', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations('post', permissions, {
  insert: async ({ tx, server, authData, can }, post: Post) => {
    // check caption for profanity on server
    if (process.env.VITE_ENVIRONMENT === 'ssr') {
      if (post.caption) {
        const profanityCheck = checkProfanity(post.caption)
        if (!profanityCheck.clean) {
          throw new AppError(
            'PROFANITY_DETECTED',
            'Content violates community guidelines',
            {
              flaggedWords: profanityCheck.flaggedWords,
            },
          )
        }
      }
    }

    await tx.mutate.post.insert(post)
    await can(permissions, post.id)

    if (process.env.VITE_ENVIRONMENT === 'ssr' && server && authData) {
      server.enqueueTask(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'post_created', {
          postId: post.id,
          hasImage: Boolean(post.image),
        }),
      )
    }
  },

  delete: async ({ tx, server, authData, can }, obj: { id: string }) => {
    await can(permissions, obj.id)
    const post = await tx.run(zql.post.where('id', obj.id).one())
    await tx.mutate.post.delete({ id: obj.id })

    if (process.env.VITE_ENVIRONMENT === 'ssr' && server && authData) {
      if (post) {
        server.enqueueTask(() =>
          server.actions.analyticsActions().logEvent(authData.id, 'post_deleted', {
            postId: obj.id,
            postAge: post?.createdAt ? Date.now() - post.createdAt : undefined,
            hasImage: Boolean(post?.image),
          }),
        )
      }
    }
  },
})
