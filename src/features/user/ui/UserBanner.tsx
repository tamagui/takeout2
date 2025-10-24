import { H1, Spacer, XStack, YStack } from 'tamagui'
import { Avatar } from '~/interface/avatars/Avatar'
import { TOP_BAR_HEIGHT } from '~/interface/constants'
import type { User } from '~/data/types'
import { isUserOnline } from '../isUserOnline'
import { UserFriendButton } from './UserFriendButton'

export const UserBanner = ({ user }: { user: User }) => {
  if (!user) {
    return null
  }

  const paddingTop = TOP_BAR_HEIGHT
  // const paddingBottom = showingThreadsBar ? 50 : 0

  return (
    <XStack z={100} bg="$color1" width="100%" height="auto" pt={paddingTop}>
      <XStack px="$4" py="$4" width="100%">
        <XStack gap="$4" flex={25} items="center">
          <Avatar
            shadowColor="$shadow4"
            shadowRadius={'$2'}
            shadowOffset={{ width: 0, height: 4 }}
            size={62}
            image={user?.image || ''}
            isOnline={isUserOnline(user)}
          />

          <YStack gap="$1" flex={1} overflow="hidden">
            <H1 select="none" cursor="default" size={'$8'} fontFamily="$mono">
              {user?.username || ''}
            </H1>

            <UserFriendButton user={user} />

            {/* <SizableText
              size={'$4'}
              select="none"
              opacity={0.5}
              cursor="default"
              fontFamily="$mono"
              ellipse
            >

            </SizableText> */}
          </YStack>
        </XStack>

        <Spacer flex />
      </XStack>
    </XStack>
  )
}
