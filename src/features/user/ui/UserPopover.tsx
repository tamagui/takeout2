import { Popover } from '~/interface/popover/Popover'
import type { UserWithState } from '~/data/types'
import { globalUserPopoverHover } from './GlobalUserPopover'
import { messageHoverPrevent } from '~/features/message/constants'

export const UserPopover = ({
  user,
  children,
}: {
  user?: UserWithState
  children: any
}) => {
  return (
    <Popover.Trigger
      asChild
      scope="user-popover"
      onMouseEnter={() => {
        if (messageHoverPrevent.value) return
        if (user) {
          globalUserPopoverHover.emit(user)
        }
      }}
    >
      {children}
    </Popover.Trigger>
  )
}
