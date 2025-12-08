import { createRoute } from 'one'

import { ProfilePage } from '~/features/profile/ProfilePage'

const route = createRoute<'/(app)/(tabs)/home/profile/[userId]'>()

export const UserProfilePage = () => {
  const { userId } = route.useParams()

  if (!userId) {
    return null
  }

  return <ProfilePage userId={userId} isOwnProfile={false} />
}
