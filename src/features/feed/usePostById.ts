import { useAuth } from '~/features/auth/client/authClient'
import { useQuery, zero } from '~/zero/client'

export const usePostById = ({ postId }: { postId: string }) => {
  const { user } = useAuth()

  const [post, status] = useQuery(
    zero.query.post
      .where('id', postId || '')
      .orderBy('createdAt', 'asc')
      .one(),
    {
      enabled: !!user && !!postId,
    }
  )

  return {
    post,
    isLoadingPost: status.type === 'unknown',
  }
}
