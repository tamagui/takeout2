import { router } from 'one'
import { useState } from 'react'
import { YStack } from 'tamagui'

import { isNative } from '~/constants/platform'
import { saveRemoteImage } from '~/helpers/media/saveImage'
import { dialogConfirm, showError } from '~/interface/dialogs/actions'
import { DownloadSimpleIcon } from '~/interface/icons/phosphor/DownloadSimpleIcon'
import { UserCircleIcon } from '~/interface/icons/phosphor/UserCircleIcon'
import { WarningCircleIcon } from '~/interface/icons/phosphor/WarningCircleIcon'
import { XCircleIcon } from '~/interface/icons/phosphor/XCircleIcon'
import { ListItem } from '~/interface/lists/ListItem'
import { showToast } from '~/interface/toast/helpers'
import { zero } from '~/zero/client'

import { ReportPostDialog } from './ReportPostDialog'

import type { Post } from '~/data/types'

interface PostActionItemsProps {
  post: Post
  isOwnPost?: boolean
  onClose?: () => void
}

export function PostActionItems({
  post,
  isOwnPost = false,
  onClose,
}: PostActionItemsProps) {
  const isAdmin = false
  const [showReportDialog, setShowReportDialog] = useState<boolean>(false)

  const handleSaveImage = async () => {
    if (!post?.image) return
    onClose?.()
    try {
      await saveRemoteImage(post.image)
      showToast('Image saved to gallery', { type: 'success' })
      setShowReportDialog(false)
    } catch (err) {
      showError(err, 'Save Image')
    }
  }

  const handleViewProfile = () => {
    if (!post) return
    onClose?.()
    router.push(`/home/profile/${post.userId}`)
  }

  const handleReport = () => {
    if (!post) return
    onClose?.()
    setShowReportDialog(true)
  }

  const handleBlock = async () => {
    if (!post) return

    const confirmed = await dialogConfirm({
      title: 'Block User',
      description:
        "Are you sure you want to block this user? You won't see their posts anymore.",
    })

    if (!confirmed) return

    try {
      await zero.mutate.block.insert({
        blockedId: post.userId,
      })
      showToast('User blocked')
      onClose?.()
    } catch (error) {
      showError(error, 'Block User')
    }
  }

  const handleAdminHide = async () => {
    if (!post || !isAdmin) return

    try {
      await zero.mutate.post.update({
        id: post.id,
        hiddenByAdmin: true,
      })
      showToast('Post hidden')
      onClose?.()
    } catch (error) {
      showError(error, 'Hide Post')
    }
  }

  return (
    <>
      <YStack gap="$2" py="$2">
        <ListItem onPress={handleSaveImage} size="large" height={50}>
          <ListItem.Icon>
            <DownloadSimpleIcon size={22} color="$color10" />
          </ListItem.Icon>
          <ListItem.Text>Save Image</ListItem.Text>
        </ListItem>

        {!isOwnPost && (
          <ListItem onPress={handleViewProfile} size="large" height={50}>
            <ListItem.Icon>
              <UserCircleIcon />
            </ListItem.Icon>
            <ListItem.Text>View Profile</ListItem.Text>
          </ListItem>
        )}

        <ListItem onPress={handleReport} size="large" height={50}>
          <ListItem.Icon>
            <WarningCircleIcon />
          </ListItem.Icon>
          <ListItem.Text>Report</ListItem.Text>
        </ListItem>

        <ListItem onPress={handleBlock} size="large" height={50}>
          <ListItem.Icon>
            <XCircleIcon />
          </ListItem.Icon>
          <ListItem.Text>Block User</ListItem.Text>
        </ListItem>

        {isAdmin && (
          <ListItem onPress={handleAdminHide} size="large" height={50}>
            <ListItem.Icon>
              <WarningCircleIcon />
            </ListItem.Icon>
            <ListItem.Text>Hide Post (Admin)</ListItem.Text>
          </ListItem>
        )}
      </YStack>

      <ReportPostDialog
        postId={post.id}
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
      />
    </>
  )
}
