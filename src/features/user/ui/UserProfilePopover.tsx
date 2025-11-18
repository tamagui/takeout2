import type { ReactNode } from 'react'
import { PopoverMenu } from '~/interface/popover/PopoverMenu'
import { UserProfilePopoverContent } from './UserProfilePopoverContent'

interface UserProfilePopoverProps {
  trigger: ReactNode
}

export function UserProfilePopover({ trigger }: UserProfilePopoverProps) {
  return (
    <PopoverMenu name="user-profile" shadow="strong" trigger={trigger}>
      <UserProfilePopoverContent />
    </PopoverMenu>
  )
}
