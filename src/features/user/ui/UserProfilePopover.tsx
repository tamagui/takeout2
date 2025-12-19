import { PopoverMenu } from '~/interface/popover/PopoverMenu'

import { UserProfilePopoverContent } from './UserProfilePopoverContent'

import type { ReactNode } from 'react'

interface UserProfilePopoverProps {
  trigger: ReactNode
}

export function UserProfilePopover({ trigger }: UserProfilePopoverProps) {
  return (
    <PopoverMenu name="user-profile" shadow="medium" snapPoints={[55]} trigger={trigger}>
      <UserProfilePopoverContent />
    </PopoverMenu>
  )
}
