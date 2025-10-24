import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { dialogConfirm } from '~/interface/dialogs/actions'
import { ensureSignedUp } from '~/interface/dialogs/isSignedUpEmitter'
import { zero } from '~/zero/client'
import type { UserWithState } from '~/data/types'
import { removeFriendship } from '../removeFriendship'
import { useFriendship } from '../useFriendship'
import { useUser } from '../useUser'
import { friendRequestIcons } from './friendRequestIcons'

export const UserFriendButton = ({ user }: { user: UserWithState }) => {
  const { user: currentUser } = useUser()

  const [friendship, status] = useFriendship(user, currentUser)

  // cant friend yourself
  if (user.id === currentUser?.id) {
    return null
  }

  return (
    <ButtonSimple
      tooltipPlacement="right"
      tooltip={
        status === 'accepted'
          ? 'Friends'
          : status === 'not-friend'
            ? 'Add friend'
            : 'Requested'
      }
      icon={friendRequestIcons[status]}
      scaleIcon={1.1}
      theme={status === 'requested' ? 'yellow' : status === 'accepted' ? 'green' : null}
      active
      onPress={async () => {
        if (!currentUser) {
          ensureSignedUp()
          return
        }

        if (friendship) {
          if (friendship.accepted) {
            // confirm delete if already accepted
            if (
              await dialogConfirm({
                title: `Remove friend?`,
                description: '',
              })
            ) {
              removeFriendship(friendship)
            } else {
              return
            }
          }

          // if not already accepted just toggle immediately
          removeFriendship(friendship)
          return
        }

        zero.mutate.friendship.insert({
          accepted: false,
          acceptingId: currentUser.id,
          createdAt: Date.now(),
          requestingId: user.id,
        })
        zero.mutate.friendship.insert({
          accepted: false,
          acceptingId: user.id,
          createdAt: Date.now(),
          requestingId: currentUser.id,
        })
      }}
    />
  )
}
