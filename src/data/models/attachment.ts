import { boolean, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import type { AttachmentType } from 'start/types'

export type Attachment = TableInsertRow<typeof schema>

export const schema = table('attachment')
  .columns({
    id: string(),
    uid: string().optional(),
    userId: string(),
    messageId: string().optional(),
    channelId: string().optional(),
    type: string<AttachmentType>(),
    data: string().optional(),
    name: string(),
    url: string().optional(),
    thumbnail: string().optional(),
    createdAt: number(),
    draft: boolean().optional(),
    uploadPercent: number(),
    error: string().optional(),
  })
  .primaryKey('id')

export const permissions = where('attachment', (_, auth) => {
  const authData = auth
  const isUserCreator = _.cmp('userId', authData?.id || '')
  return {
    read: true,
    write: isUserCreator,
  }
})

export const mutate = mutations(schema, permissions)
