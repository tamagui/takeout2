import { number, string, table } from '@rocicorp/zero'
import { AppError } from '@take-out/helpers'
import { mutations, serverWhere } from 'on-zero'

import { checkProfanity } from '~/features/moderation/profanityFilter'

import type { Comment } from '../generated/types'

export const schema = table('comment')
  .columns({
    id: string(),
    postId: string(),
    userId: string(),
    content: string(),
    createdAt: number(),
  })
  .primaryKey('id')

const permissions = serverWhere('comment', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations(schema, permissions, {
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
            }
          )
        }
      }
    }

    await tx.mutate.comment.insert(comment)

    if (process.env.VITE_ENVIRONMENT === 'ssr' && server && authData) {
      server.asyncTasks.push(async () => {
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
