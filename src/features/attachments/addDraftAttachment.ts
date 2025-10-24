import { isEqualDeepLite } from '@vxrn/helpers'
import { randomId } from '@vxrn/helpers'
import { zero } from '~/zero/client'
import type { Attachment, DraftMessage } from '~/data/types'

export type AttachmentUpload = Omit<
  Attachment,
  'id' | 'createdAt' | 'userId' | 'messageId' | 'channelId' | 'draft'
> & {
  uid: string
  userId?: string
  messageId?: string
  channelId?: string
}

const AttachmentPromises = new Map<string, Promise<void>>()
const attachmentsByUID = new Map<string, Attachment>()

export async function addDraftAttachment(
  draftMessage: DraftMessage,
  attachmentIn: AttachmentUpload
): Promise<void> {
  const attachment = {
    ...attachmentIn,
    userId: draftMessage.creatorId,
    messageId: draftMessage.id,
    channelId: draftMessage.channelId,
    draft: true,
  }

  const uid = attachment.uid
  const existing =
    (uid && attachmentsByUID.get(uid)) ||
    draftMessage?.attachments?.find((a) => a.uid === uid)

  const final: Attachment = {
    ...attachment,
    createdAt: existing?.createdAt || Date.now(),
    id: existing?.id || randomId(),
  }

  if (existing) {
    if (isEqualDeepLite(existing, final)) {
      return
    }
  }

  attachmentsByUID.set(uid, final)

  if (uid) {
    const existingMutation = AttachmentPromises.get(uid)
    if (existingMutation) {
      await existingMutation
    }
  }

  const promise = zero.mutate.attachment.upsert(final).client

  if (uid) {
    AttachmentPromises.set(uid, promise)
  }

  await promise
}
