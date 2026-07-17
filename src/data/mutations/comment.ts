import { AppError } from '@take-out/helpers'
import { mutations, serverWhere } from 'on-zero'

import { checkProfanity } from '~/features/moderation/profanityFilter'

import type { Comment } from '../types'

const permissions = serverWhere('comment', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations('comment', permissions, {
  insert: async ({ tx, server, authData }, comment: Comment) => {
    if (process.env.VITE_ENVIRONMENT === 'ssr') {
      if (comment.content) {
        const profanityCheck = checkProfanity(comment.content)
        if (!profanityCheck.clean) {
          throw new AppError(
            'PROFANITY_DETECTED',
            'Comment violates community guidelines',
            {
              flaggedWords: profanityCheck.flaggedWords,
            },
          )
        }
      }
    }

    await tx.mutate.comment.insert(comment)

    if (process.env.VITE_ENVIRONMENT === 'ssr' && server && authData) {
      server.enqueueTask(async () => {
        await server.actions.pushNotificationActions().notifyCommentOnPost({
          postId: comment.postId,
          commentId: comment.id,
          commenterId: comment.userId,
          commentContent: comment.content,
        })
      })
    }
  },
})
