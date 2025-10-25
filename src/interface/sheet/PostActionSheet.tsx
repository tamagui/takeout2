import { router } from 'one'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { YStack } from 'tamagui'
import type { Post } from '~/data/models'
import { createConversation } from '~/features/conversation/createConversation'
import { useStudioCreate } from '~/features/studio/StudioCreateContext'
import { useUser } from '~/features/user/useUser'
import { MagicWandIcon } from '~/interface/icons/phosphor/MagicWandIcon'
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
  const { setSelectedRemixPhoto } = useStudioCreate()

  const { userRole, user } = useUser({ includeRole: true })

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
    setTimeout(() => {
      router.push(`/home/profile/${currentPost?.userId}`)
    }, 250)
  }

  const handleRemix = async () => {
    if (!currentPost) return

    sheetRef.current?.collapse()
    setSelectedRemixPhoto(currentPost.image)
    const conversationId = await createConversation({
      type: 'remix',
    })
    setTimeout(() => {
      router.push(`/studio/conversation/${conversationId}`)
    }, 250)
  }

  const handleReport = () => {
    if (!currentPost) return
    sheetRef.current?.collapse()
    setTimeout(() => {
      showReportForPost(currentPost.id)
    }, 250)
  }

  const handleBlock = () => {
    if (!currentPost) return

    Alert.alert(
      'Block User',
      `Are you sure you want to block this user? You won't see their content anymore.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              zero.mutate.block.insert({ blockedId: currentPost.userId })
              showToast(`User blocked`, { type: 'success' })
              sheetRef.current?.collapse()
            } catch (error) {
              console.error('Failed to block user', error)
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  const handleAdminHide = () => {
    if (!currentPost) return

    Alert.alert(
      'Hide Post for Everyone',
      `Are you sure you want to use your admin powers to hide this post for everyone?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Hide',
          style: 'destructive',
          onPress: async () => {
            try {
              zero.mutate.post.update({
                id: currentPost.id,
                draft: true, // TODO[hiddenByAdmin][3]: we set this for backwards compatibility so that user's don't need to update their client to not see the post anymore. We can remove this in a future release when all clients have the hiddenByAdmin field
                hiddenByAdmin: true,
              })
              showToast(`Post hidden`, { type: 'success' })
              sheetRef.current?.collapse()
            } catch (error) {
              console.error('Failed to hide post', error)
              showToast(
                `Failed: ${error instanceof Error ? error.message : 'unknown error'}`,
                { type: 'error' }
              )
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  return (
    <Sheet ref={sheetRef} title="Actions">
      <YStack gap="$2">
        <ListItem
          onPress={handleViewProfile}
          size="large"
          bg="$color3"
          pressStyle={{ bg: '$color2' }}
          height={50}
        >
          <UserCircleIcon size={22} color="$color10" />
          <ListItem.Text fontWeight="600">View Profile</ListItem.Text>
        </ListItem>

        <ListItem
          onPress={handleRemix}
          size="large"
          bg="$color3"
          pressStyle={{ bg: '$color2' }}
          height={50}
        >
          <MagicWandIcon size={22} color="$color10" />
          <ListItem.Text fontWeight="600">Remix</ListItem.Text>
        </ListItem>

        <PostActionSheetSharedItems currentPost={currentPost} sheetRef={sheetRef} />

        <ListItem
          onPress={handleReport}
          size="large"
          bg="$color3"
          pressStyle={{ bg: '$color2' }}
          height={50}
        >
          <WarningCircleIcon size={22} color="$red10" />
          <ListItem.Text fontWeight="600" color="$red10">
            Report
          </ListItem.Text>
        </ListItem>

        <ListItem
          onPress={handleBlock}
          size="large"
          bg="$color3"
          pressStyle={{ bg: '$color2' }}
          height={50}
        >
          <ShieldCheckIcon size={22} color="$red10" />
          <ListItem.Text fontWeight="600" color="$red10">
            Block User
          </ListItem.Text>
        </ListItem>

        {userRole === 'admin' && (
          <ListItem
            onPress={handleAdminHide}
            size="large"
            bg="$color3"
            pressStyle={{ bg: '$color2' }}
            height={50}
          >
            <WarningCircleIcon size={22} color="$red10" />
            <ListItem.Text fontWeight="600" color="$red10">
              Admin: Hide Post for Everyone
            </ListItem.Text>
          </ListItem>
        )}
      </YStack>
    </Sheet>
  )
})
