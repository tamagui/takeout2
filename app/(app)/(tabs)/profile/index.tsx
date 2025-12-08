import { useAuth } from '~/features/auth/client/authClient'
import { ProfilePage } from '~/features/profile/ProfilePage'

export const OwnProfilePage = () => {
  const auth = useAuth()
  const userId = auth.user?.id

  if (!userId) {
    return null
  }

  return <ProfilePage userId={userId} isOwnProfile />
}
