import { createRoute } from 'one'

const route = createRoute<'/(app)/(tabs)/home/post/[feedId]'>()

export { FeedDetailPage } from '~/features/feed/FeedDetailPage'
