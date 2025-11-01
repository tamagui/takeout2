import type { Post } from '~/data/types'
import { saveRemoteImage } from '~/helpers/media/saveImage'
import type { SheetRef } from '~/interface/sheet/Sheet'
import { isNative } from '~/constants/platform'
import { showToast } from '../toast/helpers'
import { ListItem } from '../lists/ListItem'
import { DownloadSimpleIcon } from '../icons/phosphor/DownloadSimpleIcon'

export function PostActionSheetSharedItems({
  currentPost,
  sheetRef,
}: {
  currentPost: Post | null
  sheetRef: React.RefObject<SheetRef | null>
}) {
  const handleSaveImage = async () => {
    if (!currentPost?.image) return
    // Close the sheet first for better UX
    sheetRef.current?.collapse()
    try {
      // saveRemoteImage shows a loader and toasts internally
      await saveRemoteImage(currentPost.image)
    } catch (err) {
      // Fallback toast just in case helper throws
      showToast('Failed to save image', { type: 'error' })
    }
  }

  return (
    <>
      {/* Save Image (native only) */}
      {isNative && (
        <ListItem
          onPress={handleSaveImage}
          size="large"
          bg="$color3"
          pressStyle={{ bg: '$color2' }}
          height={50}
        >
          <DownloadSimpleIcon size={22} color="$color10" />
          <ListItem.Text fontWeight="600">Save Image</ListItem.Text>
        </ListItem>
      )}
    </>
  )
}
