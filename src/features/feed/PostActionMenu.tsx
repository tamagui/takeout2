import { isNative, randomId } from '@take-out/helpers'
import { Menu } from '@tamagui/menu'
import { router } from 'one'
import { useIsTouchDevice } from 'tamagui'

import { saveRemoteImage } from '~/helpers/media/saveImage'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Pressable } from '~/interface/buttons/Pressable'
import { dialogConfirm, showError } from '~/interface/dialogs/actions'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'
import { DotsThreeIcon } from '~/interface/icons/phosphor/DotsThreeIcon'
import { DownloadSimpleIcon } from '~/interface/icons/phosphor/DownloadSimpleIcon'
import { UserCircleIcon } from '~/interface/icons/phosphor/UserCircleIcon'
import { WarningCircleIcon } from '~/interface/icons/phosphor/WarningCircleIcon'
import { XCircleIcon } from '~/interface/icons/phosphor/XCircleIcon'
import { showToast } from '~/interface/toast/helpers'
import { zero } from '~/zero/client'

import type { Post } from '~/data/types'

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or Bullying' },
  { value: 'other', label: 'Other' },
] as const

interface PostActionMenuProps {
  post: Post
  isOwnPost: boolean
}

export function PostActionMenu({ post, isOwnPost }: PostActionMenuProps) {
  const isAdmin = false
  const isTouchDevice = useIsTouchDevice()

  const handleSaveImage = async () => {
    if (!post?.image) return
    await saveRemoteImage(post.image)
  }

  const handleViewProfile = () => {
    if (!post) return
    router.push(`/home/profile/post/${post.userId}`)
  }

  const handleReportPost = (reason: string) => {
    if (!post) return

    try {
      zero.mutate.report.reportPost({
        postId: post.id,
        reason,
        details: '',
      })
      showToast('Thanks for reporting', { type: 'success' })
    } catch (error) {
      showError(error, 'Report Post')
    }
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
      zero.mutate.block.insert({
        id: randomId(),
        createdAt: Date.now(),
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
    <Menu allowFlip placement="bottom-end" offset={8}>
      <Menu.Trigger asChild>
        <ButtonSimple
          circular
          aria-label="Post actions"
          variant="floating"
          icon={DotsThreeIcon}
          scaleIcon={2}
          width={36}
          height={36}
          disableBackground
        />
      </Menu.Trigger>

      <Menu.Portal zIndex={100}>
        <Menu.Content
          transition="200ms"
          borderRadius="$4"
          enterStyle={{ scale: 0.9, opacity: 0, y: -5 }}
          exitStyle={{ scale: 0.95, opacity: 0, y: -3 }}
          boxShadow="0 $2 $4 $shadowColor"
        >
          <Menu.Item
            key="save-image"
            onSelect={handleSaveImage}
            justify="space-between"
            textValue="Save Image"
          >
            <Menu.ItemTitle>Save Image</Menu.ItemTitle>
            <Menu.ItemIcon
              ios={{ name: 'arrow.down.circle', pointSize: 18 }}
              androidIconName="ic_menu_save"
            >
              <DownloadSimpleIcon size={18} color="$color10" />
            </Menu.ItemIcon>
          </Menu.Item>

          {!isOwnPost && (
            <Menu.Item
              key="view-profile"
              onSelect={handleViewProfile}
              justify="space-between"
              textValue="View Profile"
            >
              <Menu.ItemTitle>View Profile</Menu.ItemTitle>
              <Menu.ItemIcon
                ios={{ name: 'person.circle', pointSize: 18 }}
                androidIconName="ic_menu_myplaces"
              >
                <UserCircleIcon size={18} color="$color10" />
              </Menu.ItemIcon>
            </Menu.Item>
          )}
          <Menu.Separator />

          {/* TODO: Just a tmp fix—the SubMenu on native doesn’t work inside a fragment */}

          {!isOwnPost && (
            <Menu.Sub placement={isTouchDevice ? 'bottom' : 'right-start'}>
              <Menu.SubTrigger
                key="report-trigger"
                justify="space-between"
                textValue="Report"
              >
                {isNative && (
                  <Menu.ItemIcon
                    ios={{ name: 'exclamationmark.triangle', pointSize: 18 }}
                    androidIconName="ic_menu_report"
                  />
                )}
                <Menu.ItemTitle>Report</Menu.ItemTitle>
                <CaretRightIcon size={16} color="$color10" />
              </Menu.SubTrigger>

              <Menu.Portal zIndex={200}>
                <Menu.SubContent
                  enterStyle={{ scale: 0.9, opacity: 0, x: -5 }}
                  exitStyle={{ scale: 0.95, opacity: 0, x: -3 }}
                  transition="100ms ease-in-out"
                  transformOrigin="left top"
                  elevation="$3"
                  minW={200}
                  bg="$background"
                  p="$1.5"
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  {REPORT_REASONS.map((reason) => (
                    <Menu.Item
                      key={reason.value}
                      onSelect={() => handleReportPost(reason.value)}
                      textValue={reason.label}
                    >
                      <Menu.ItemTitle>{reason.label}</Menu.ItemTitle>
                    </Menu.Item>
                  ))}
                </Menu.SubContent>
              </Menu.Portal>
            </Menu.Sub>
          )}
          {/* report and block options only for other users' posts */}
          {!isOwnPost && (
            <>
              <Menu.Item
                key="block"
                onSelect={handleBlock}
                destructive
                justify="space-between"
                textValue="Block User"
              >
                <Menu.ItemTitle color="$red10">Block User</Menu.ItemTitle>
                <Menu.ItemIcon
                  ios={{ name: 'xmark.circle', pointSize: 18 }}
                  androidIconName="ic_menu_close_clear_cancel"
                >
                  <XCircleIcon size={18} color="$red10" />
                </Menu.ItemIcon>
              </Menu.Item>
              <Menu.Separator />
            </>
          )}
          {isAdmin && (
            <Menu.Item
              key="admin-hide"
              onSelect={handleAdminHide}
              destructive
              justify="space-between"
              textValue="Hide Post (Admin)"
            >
              <Menu.ItemTitle color="$red10">Hide Post (Admin)</Menu.ItemTitle>
              <Menu.ItemIcon
                ios={{ name: 'eye.slash', pointSize: 18 }}
                androidIconName="ic_menu_view"
              >
                <WarningCircleIcon size={18} color="$red10" />
              </Menu.ItemIcon>
            </Menu.Item>
          )}
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  )
}
