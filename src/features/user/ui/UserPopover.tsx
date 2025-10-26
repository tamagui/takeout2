import { Popover } from '~/interface/popover/Popover'
import type { UserWithStats } from '~/data/types'
import { globalUserPopoverHover } from './GlobalUserPopover'

export const UserPopover = ({
  user,
  children,
}: {
  user?: UserWithStats
  children: any
}) => {
  return (
    <Popover.Trigger
      asChild
      scope="user-popover"
      onMouseEnter={() => {
        if (user) {
          globalUserPopoverHover.emit(user)
        }
      }}
    >
      {children}
    </Popover.Trigger>
  )
}
