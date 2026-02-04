import { createRoute } from 'one'

import { FeedDetailPage as FeedDetailPageComponent } from '~/features/feed/FeedDetailPage'

const route = createRoute<'/(app)/home/(tabs)/feed/post/[feedId]'>()

export const FeedDetailPage = () => {
  return <FeedDetailPageComponent />
}
