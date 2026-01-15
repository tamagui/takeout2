import { createRoute } from 'one'

const route = createRoute<'/(app)/home/profile/post/[feedId]'>()

export { FeedDetailPage } from '~/features/feed/FeedDetailPage'
