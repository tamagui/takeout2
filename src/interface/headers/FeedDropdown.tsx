// web version - no dropdown, just a stub
import { memo } from 'react'
import { View } from 'tamagui'

interface FeedDropdownProps {
  isOpen?: { value: number }
  onClose?: () => void
}

export const FeedDropdown = memo((_props: FeedDropdownProps) => {
  // no dropdown on web
  return <View />
})
