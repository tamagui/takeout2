import type { Post } from '~/data/models'
import { useUser } from '~/features/user/useUser'
import { useQuery, zero } from '~/zero/client'

export const usePostById = ({ postId }: { postId: string }) => {
  const { user } = useUser()

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
    insert: async (post: Post) => {
      if (!user?.id) return
      zero.mutate.post.insert({
        ...post,
      })
    },
    delete: async (postId: string) => {
      if (!user?.id) return
      zero.mutate.post.delete({
        id: postId,
      })
    },
  }
}
