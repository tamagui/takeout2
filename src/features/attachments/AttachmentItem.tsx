import { X } from '@tamagui/lucide-icons'
import { YStack } from 'tamagui'
import { BadgeCount } from '~/interface/badge/BadgeCount'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { dialogConfirm } from '~/interface/dialogs/actions'
import { deleteMessage } from '../message/deleteMessage'
import { extractUrlFromUnfurlUid, markUnfurlCancelled } from '../unfurl/cancelledUnfurls'
import { AttachmentItemMedia } from './AttachmentItemMedia'
import { AttachmentItemUnfurl } from './AttachmentItemUnfurl'
import type { AttachmentItemProps } from './types'
import { ButtonClose } from '~/interface/buttons/ButtonClose'

export const AttachmentItem = ({
  editable,
  size = 'small',
  onDelete,
  confirmDelete = false,
  attachment,
  onPress,
  message,
  index,
  ...props
}: AttachmentItemProps) => {
  const content =
    attachment.type === 'unfurl' ? (
      <AttachmentItemUnfurl
        attachment={attachment}
        size={size}
        onPress={onPress}
        {...props}
      />
    ) : (
      <AttachmentItemMedia attachment={attachment} size={size} {...props} />
    )

  return (
    <YStack
      select="none"
      onPress={onPress}
      position="relative"
      {...(onPress && {
        cursor: 'pointer',
        hoverStyle: {
          opacity: 0.95,
        },
        pressStyle: {
          opacity: 0.9,
          scale: 0.98,
        },
      })}
    >
      <BadgeCount count={index + 1} anchor="left" />
      {!!editable && (
        <ButtonClose
          size="tiny"
          position="absolute"
          t={-6}
          r={-6}
          onPress={async (e) => {
            e.stopPropagation()

            // mark unfurl cancelled to avoid re-adding
            if (attachment.type === 'unfurl' && attachment.uid && message?.id) {
              const url = extractUrlFromUnfurlUid(attachment.uid)
              if (url) {
                markUnfurlCancelled(message.id, url)
              }
            }

            if (message?.attachments?.length === 1 && !message.content) {
              // last attachment on a message with no content, delete *message*
              deleteMessage(message)
              return
            }

            if (
              confirmDelete &&
              !(await dialogConfirm({
                title: `Delete attachment?`,
              }))
            ) {
              return
            }

            onDelete?.()
          }}
        />
      )}

      <YStack
        rounded="$3"
        overflow="hidden"
        bg="$color2"
        shadowRadius={8}
        shadowColor="$shadow2"
        shadowOffset={{ height: 3, width: 0 }}
        shadowOpacity={0.15}
        borderWidth={1}
        borderColor="$color4"
      >
        {content}
      </YStack>
    </YStack>
  )
}
