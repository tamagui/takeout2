import { useParams } from 'one'
import { UserBanner } from '~/features/user/ui/UserBanner'
import { useQuery, zero } from '~/zero/client'

export const UserPage = () => {
  const params = useParams<{ username: string }>()
  const [user] = useQuery(
    zero.query.userPublic.where('username', params.username || '').one()
  )

  if (!user) {
    return null
  }

  return (
    <>
      <UserBanner user={user} />
    </>
  )
}
