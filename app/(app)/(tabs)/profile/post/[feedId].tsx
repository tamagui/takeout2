import { createRoute } from 'one'

const route = createRoute<'/(app)/(tabs)/profile/post/[feedId]'>()

export { FeedDetailPage } from '~/features/feed/FeedDetailPage'
