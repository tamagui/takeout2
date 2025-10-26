import { router } from 'one'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { YStack } from 'tamagui'
import type { Post } from '~/data/models'
import { useUser } from '~/features/user/useUser'
import { ShieldCheckIcon } from '~/interface/icons/phosphor/ShieldCheckIcon'
import { UserCircleIcon } from '~/interface/icons/phosphor/UserCircleIcon'
import { WarningCircleIcon } from '~/interface/icons/phosphor/WarningCircleIcon'
import { Sheet, type SheetRef } from '~/interface/sheet/Sheet'
import { showReportForPost } from '~/interface/sheet/reportSheetHelper'
import { showToast } from '~/interface/toast/helpers'
import { zero } from '~/zero/client'
import { ListItem } from '../lists/ListItem'
import { PostActionSheetSharedItems } from './PostActionSheetSharedItems'

export interface PostActionSheetRef {
  show: (post: Post) => void
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
    router.push(`/profile/${currentPost.userId}`)
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
                id: `${user?.id}-${currentPost.userId}`,
                blockerId: user?.id || '',
                blockedId: currentPost.userId,
                createdAt: Date.now(),
              })
              showToast({ title: 'User blocked' })
              sheetRef.current?.collapse()
            } catch (error) {
              showToast({ title: 'Failed to block user', preset: 'error' })
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
      showToast({ title: 'Post hidden' })
      sheetRef.current?.collapse()
    } catch (error) {
      showToast({ title: 'Failed to hide post', preset: 'error' })
    }
  }

  if (!currentPost) return null

  return (
    <Sheet ref={sheetRef}>
      <YStack gap="$2" py="$2">
        <PostActionSheetSharedItems post={currentPost} />

        <ListItem
          Icon={UserCircleIcon}
          title="View Profile"
          onPress={handleViewProfile}
        />

        <ListItem Icon={WarningCircleIcon} title="Report" onPress={handleReport} />

        <ListItem Icon={ShieldCheckIcon} title="Block User" onPress={handleBlock} />

        {isAdmin && (
          <ListItem
            Icon={WarningCircleIcon}
            title="Hide Post (Admin)"
            onPress={handleAdminHide}
          />
        )}
      </YStack>
    </Sheet>
  )
})

PostActionSheet.displayName = 'PostActionSheet'
