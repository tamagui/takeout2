import { boolean, number, string, table } from '@rocicorp/zero'
import { AppError } from '@take-out/helpers'
import { mutations, serverWhere, zql } from 'on-zero'

import { checkProfanity } from '~/features/moderation/profanityFilter'

import type { Post } from '../types'

export const schema = table('post')
  .columns({
    id: string(),
    userId: string(),
    image: string(),
    imageWidth: number().optional(),
    imageHeight: number().optional(),
    caption: string().optional(),
    hiddenByAdmin: boolean(),
    commentCount: number(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

const permissions = serverWhere('post', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, environment, server, authData }, post: Post) => {
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
            }
          )
        }
      }
    }

    await tx.mutate.post.insert(post)

    if (process.env.VITE_ENVIRONMENT === 'ssr' && server && authData) {
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'post_created', {
          postId: post.id,
          hasImage: Boolean(post.image),
        })
      )
    }
  },

  delete: async ({ tx, environment, server, authData }, obj: { id: string }) => {
    await tx.mutate.post.delete({ id: obj.id })

    if (process.env.VITE_ENVIRONMENT === 'ssr' && server && authData) {
      const post = await tx.run(zql.post.where('id', obj.id).one())

      if (post) {
        server.asyncTasks.push(() =>
          server.actions.analyticsActions().logEvent(authData.id, 'post_deleted', {
            postId: obj.id,
            postAge: post?.createdAt ? Date.now() - post.createdAt : undefined,
            hasImage: Boolean(post?.image),
          })
        )
      }
    }
  },
})
