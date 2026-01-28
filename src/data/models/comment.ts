import { number, string, table } from '@rocicorp/zero'
import { mutations, serverWhere } from 'over-zero'

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
  insert: async ({ tx, environment }, comment: Comment) => {
    if (process.env.VITE_ENVIRONMENT === 'ssr') {
      if (comment.content) {
        const profanityCheck = checkProfanity(comment.content)
        if (!profanityCheck.clean) {
          throw new Error('Comment violates community guidelines')
        }
      }
    }

    await tx.mutate.comment.insert(comment)
  },
})
