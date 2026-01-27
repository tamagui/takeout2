import { FeedDetailPage as FeedDetailPageComponent } from '~/features/feed/FeedDetailPage'
import { createRoute } from 'one'

const route = createRoute<'/(app)/home/(tabs)/profile/post/[feedId]'>()

export const FeedDetailPage = () => {
  return <FeedDetailPageComponent />
}
