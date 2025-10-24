import { UserCheck, UserPlus, UserX } from '@tamagui/lucide-icons'
import type { FriendshipStatus } from '../types'

export const friendRequestIcons: Record<FriendshipStatus, any> = {
  'not-friend': UserPlus,
  accepted: UserCheck,
  requested: UserX,
}
