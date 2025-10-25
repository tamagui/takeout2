import * as Burnt from 'burnt'
import { router } from 'one'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { YStack } from 'tamagui'
import type { Post } from '~/data/models'
import { createConversation } from '~/features/conversation/createConversation'
import { usePostById } from '~/features/feed/usePostById'
import { useStudioCreate } from '~/features/studio/StudioCreateContext'
import { MagicWandIcon } from '~/interface/icons/phosphor/MagicWandIcon'
import { PencilSimpleIcon } from '~/interface/icons/phosphor/PencilSimpleIcon'
import { TrashIcon } from '~/interface/icons/phosphor/TrashIcon'
import { Sheet, type SheetRef } from '~/interface/sheet/Sheet'
import { showToast } from '~/interface/toast/helpers'
import { WarningCircleIcon } from '../icons/phosphor/WarningCircleIcon'
import { ListItem } from '../lists/ListItem'
import type { PostActionSheetOptions } from './postActionSheetHelper'
import { showReportForPost } from './reportSheetHelper'
import { PostActionSheetSharedItems } from './PostActionSheetSharedItems'

export interface PostOwnerActionSheetRef {
  show: (post: Post, options?: PostActionSheetOptions) => void
  hide: () => void
}

export const PostOwnerActionSheet = forwardRef<PostOwnerActionSheetRef>((_, ref) => {
  const sheetRef = useRef<SheetRef>(null)
  const [currentPost, setCurrentPost] = useState<Post | null>(null)
  const [options, setOptions] = useState<PostActionSheetOptions | undefined>()
  const { setSelectedRemixPhoto } = useStudioCreate()
  const { delete: deletePostById } = usePostById({ postId: currentPost?.id || '' })

  useImperativeHandle(ref, () => ({
    show: (post: Post, sheetOptions?: PostActionSheetOptions) => {
      setCurrentPost(post)
      setOptions(sheetOptions)
      sheetRef.current?.expand()
    },
    hide: () => {
      sheetRef.current?.collapse()
    },
  }))

  const deletePost = async () => {
    try {
      Burnt.alert({
        title: 'Deleting post...',
        duration: 10_000,
        preset: 'spinner',
      })
      await deletePostById(currentPost?.id || '')

      Burnt.dismissAllAlerts()
      showToast('Post deleted', { type: 'success' })

      if (options?.shouldNavigateBackOnDelete) {
        router.back()
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      Burnt.dismissAllAlerts()
    }
  }

  const handleViewProfile = () => {
    if (!currentPost) return

    sheetRef.current?.collapse()
    setTimeout(() => {
      router.push('/profile')
    }, 250)
  }

  const handleEdit = () => {
    if (!currentPost) return

    sheetRef.current?.collapse()
    setTimeout(() => {
      router.push(`/studio/post/edit/${currentPost.id}`)
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

  const handleDelete = () => {
    if (!currentPost) return

    sheetRef.current?.collapse()

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deletePost,
        },
      ],
      { cancelable: true }
    )
  }

  const handleReport = () => {
    if (!currentPost) return
    sheetRef.current?.collapse()
    setTimeout(() => {
      showReportForPost(currentPost.id)
    }, 250)
  }

  return (
    <Sheet ref={sheetRef} title="Actions">
      <YStack gap="$2">
        {/* <ListItem
          onPress={handleViewProfile}
          size="large"
          bg="$color3"
          pressStyle={{ bg: '$color2' }}
          height={50}
        >
          <UserCircleIcon size={22} color="$color10" />
          <ListItem.Text fontWeight="600">View Profile</ListItem.Text>
        </ListItem> */}

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

        <ListItem
          onPress={handleEdit}
          size="large"
          bg="$color3"
          pressStyle={{ bg: '$color2' }}
          height={50}
        >
          <PencilSimpleIcon size={22} color="$color10" />
          <ListItem.Text fontWeight="600">Edit Post</ListItem.Text>
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
          onPress={handleDelete}
          size="large"
          bg="$color3"
          pressStyle={{ bg: '$color2' }}
          height={50}
        >
          <TrashIcon size={22} color="$red10" />
          <ListItem.Text fontWeight="600" color="$red10">
            Delete
          </ListItem.Text>
        </ListItem>
      </YStack>
    </Sheet>
  )
})
