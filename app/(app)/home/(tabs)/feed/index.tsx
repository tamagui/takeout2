import { useMedia } from 'tamagui'

import { FeedContent } from '~/features/feed/FeedContent'

export const HomePage = () => {
  const { lg } = useMedia()

  if (!lg) {
    return <FeedContent />
  }

  return null
}
