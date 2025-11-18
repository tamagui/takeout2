import type { Post } from '~/data/types'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { DotsThreeIcon } from '~/interface/icons/phosphor/DotsThreeIcon'
import { PopoverMenu } from '~/interface/popover/PopoverMenu'
import { PostActionItems } from './PostActionItems'

interface PostActionsPopoverProps {
  post: Post
  isOwnPost: boolean
}

export function PostActionsPopover({ post, isOwnPost }: PostActionsPopoverProps) {
  return (
    <PopoverMenu
      name="post-actions"
      shadow="medium"
      trigger={
        <ButtonSimple size="small" circular glass>
          <DotsThreeIcon size={16} color="$color12" />
        </ButtonSimple>
      }
    >
      <PostActionItems post={post} isOwnPost={isOwnPost} />
    </PopoverMenu>
  )
}
