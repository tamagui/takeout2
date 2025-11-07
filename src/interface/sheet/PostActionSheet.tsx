import { router } from 'one'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { YStack } from 'tamagui'
import type { Post } from '~/data/types'
import { useUser } from '~/features/user/useUser'
import { ShieldCheckIcon } from '~/interface/icons/phosphor/ShieldCheckIcon'
import { UserCircleIcon } from '~/interface/icons/phosphor/UserCircleIcon'
import { WarningCircleIcon } from '~/interface/icons/phosphor/WarningCircleIcon'
import { Sheet, type SheetRef } from '~/interface/sheet/Sheet'
import { showReportForPost } from '~/interface/sheet/reportSheetHelper'
import { showToast } from '~/interface/toast/helpers'
import { showError } from '~/interface/dialogs/actions'
import { zero } from '~/zero/client'
import { ListItem } from '../lists/ListItem'
import { PostActionSheetSharedItems } from './PostActionSheetSharedItems'
import type { PostActionSheetOptions } from './postActionSheetHelper'

export interface PostActionSheetRef {
  show: (post: Post, isOwnProfile?: boolean, options?: PostActionSheetOptions) => void
  hide: () => void
}

export const PostActionSheet = forwardRef<PostActionSheetRef>((_, ref) => {
  const sheetRef = useRef<SheetRef>(null)
  const [currentPost, setCurrentPost] = useState<Post | null>(null)

  const { user } = useUser()
  const isAdmin = false // Simple admin check - you can implement proper role checking

  useImperativeHandle(ref, () => ({
    show: (post: Post) => {
      setCurrentPost(post)
      sheetRef.current?.expand()
    },
    hide: () => {
      sheetRef.current?.collapse()
    },
  }))

  const handleViewProfile = () => {
    if (!currentPost) return
    sheetRef.current?.collapse()
    // router.push(`/profile/${currentPost.userId}`)
  }

  const handleReport = () => {
    if (!currentPost) return
    sheetRef.current?.collapse()
    showReportForPost(currentPost.id)
  }

  const handleBlock = async () => {
    if (!currentPost) return

    Alert.alert(
      'Block User',
      "Are you sure you want to block this user? You won't see their posts anymore.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await zero.mutate.block.insert({
                blockedId: currentPost.userId,
              })
              showToast('User blocked')
              sheetRef.current?.collapse()
            } catch (error) {
              showError(error, 'Block User')
            }
          },
        },
      ]
    )
  }

  const handleAdminHide = async () => {
    if (!currentPost || !isAdmin) return

    try {
      await zero.mutate.post.update({
        id: currentPost.id,
        hiddenByAdmin: true,
      })
      showToast('Post hidden')
      sheetRef.current?.collapse()
    } catch (error) {
      showError(error, 'Hide Post')
    }
  }

  if (!currentPost) return null

  return (
    <Sheet ref={sheetRef}>
      <YStack gap="$2" py="$2">
        <PostActionSheetSharedItems currentPost={currentPost} sheetRef={sheetRef} />

        <ListItem onPress={handleViewProfile}>
          <ListItem.Icon>
            <UserCircleIcon />
          </ListItem.Icon>
          <ListItem.Text>View Profile</ListItem.Text>
        </ListItem>

        <ListItem onPress={handleReport}>
          <ListItem.Icon>
            <WarningCircleIcon />
          </ListItem.Icon>
          <ListItem.Text>Report</ListItem.Text>
        </ListItem>

        <ListItem onPress={handleBlock}>
          <ListItem.Icon>
            <ShieldCheckIcon />
          </ListItem.Icon>
          <ListItem.Text>Block User</ListItem.Text>
        </ListItem>

        {isAdmin && (
          <ListItem onPress={handleAdminHide}>
            <ListItem.Icon>
              <WarningCircleIcon />
            </ListItem.Icon>
            <ListItem.Text>Hide Post (Admin)</ListItem.Text>
          </ListItem>
        )}
      </YStack>
    </Sheet>
  )
})

PostActionSheet.displayName = 'PostActionSheet'
