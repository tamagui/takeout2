import { useAuth } from '~/features/auth/client/authClient'
import { useQuery } from '~/zero/client'
import { postById } from '~/data/generated/queries'

export const usePostById = ({ postId }: { postId: string }) => {
  const { user } = useAuth()

  const [post, status] = useQuery(
    postById,
    { postId },
    {
      enabled: !!user && !!postId,
    }
  )

  return {
    post,
    isLoadingPost: status.type === 'unknown',
  }
}
