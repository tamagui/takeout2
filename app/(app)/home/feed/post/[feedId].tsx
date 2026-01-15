import { createRoute } from 'one'

const route = createRoute<'/(app)/home/home/post/[feedId]'>()

export { FeedDetailPage } from '~/features/feed/FeedDetailPage'
