import { router } from 'one'
import { useState } from 'react'
import * as DropdownMenu from 'zeego/dropdown-menu'

import { saveRemoteImage } from '~/helpers/media/saveImage'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { dialogConfirm, showError } from '~/interface/dialogs/actions'
import { DotsThreeIcon } from '~/interface/icons/phosphor/DotsThreeIcon'
import { DownloadSimpleIcon } from '~/interface/icons/phosphor/DownloadSimpleIcon'
import { UserCircleIcon } from '~/interface/icons/phosphor/UserCircleIcon'
import { WarningCircleIcon } from '~/interface/icons/phosphor/WarningCircleIcon'
import { XCircleIcon } from '~/interface/icons/phosphor/XCircleIcon'
import { showToast } from '~/interface/toast/helpers'
import { zero } from '~/zero/client'

import { ReportPostDialog } from './ReportPostDialog'

import type { Post } from '~/data/types'

// TODO: Tamagui v2 Menu!

interface PostActionMenuProps {
  post: Post
  isOwnPost: boolean
}

export function PostActionMenu({ post, isOwnPost }: PostActionMenuProps) {
  const isAdmin = false
  const [showReportDialog, setShowReportDialog] = useState<boolean>(false)

  const handleSaveImage = async () => {
    if (!post?.image) return
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
    router.push(`/home/profile/${post.userId}`)
  }
  const handleReport = () => {
    if (!post) return
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
    } catch (error) {
      showError(error, 'Hide Post')
    }
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <ButtonSimple size="small" circular glass aria-label="Post actions">
            <DotsThreeIcon size={16} color="$color12" />
          </ButtonSimple>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item key="save-image" onSelect={handleSaveImage}>
            <DropdownMenu.ItemIcon
              ios={{ name: 'arrow.down.circle' }}
              androidIconName="ic_menu_save"
            >
              <DownloadSimpleIcon size={22} />
            </DropdownMenu.ItemIcon>
            <DropdownMenu.ItemTitle>Save Image</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>

          {!isOwnPost && (
            <DropdownMenu.Item key="view-profile" onSelect={handleViewProfile}>
              <DropdownMenu.ItemIcon
                ios={{ name: 'person.circle' }}
                androidIconName="ic_menu_myplaces"
              >
                <UserCircleIcon />
              </DropdownMenu.ItemIcon>
              <DropdownMenu.ItemTitle>View Profile</DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Item key="report" onSelect={handleReport}>
            <DropdownMenu.ItemIcon
              ios={{ name: 'exclamationmark.triangle' }}
              androidIconName="ic_menu_report_image"
            >
              <WarningCircleIcon />
            </DropdownMenu.ItemIcon>
            <DropdownMenu.ItemTitle>Report</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>

          <DropdownMenu.Item key="block" onSelect={handleBlock} destructive>
            <DropdownMenu.ItemIcon
              ios={{ name: 'xmark.circle' }}
              androidIconName="ic_menu_close_clear_cancel"
            >
              <XCircleIcon />
            </DropdownMenu.ItemIcon>
            <DropdownMenu.ItemTitle>Block User</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>

          {isAdmin && (
            <DropdownMenu.Item key="admin-hide" onSelect={handleAdminHide} destructive>
              <DropdownMenu.ItemIcon
                ios={{ name: 'eye.slash' }}
                androidIconName="ic_menu_view"
              >
                <WarningCircleIcon />
              </DropdownMenu.ItemIcon>
              <DropdownMenu.ItemTitle>Hide Post (Admin)</DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <ReportPostDialog
        postId={post.id}
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
      />
    </>
  )
}
