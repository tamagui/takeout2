import { memo } from 'react'
import { AnimatePresence, YStack } from 'tamagui'

import { PostCard } from '~/features/feed/PostCard'
import { usePostsPaginated } from '~/features/feed/usePosts'
import { HeadInfo } from '~/interface/app/HeadInfo'
import { FloatingCreateButton } from '~/interface/buttons/FloatingCreateButton'
import { Pagination } from '~/interface/navigation/Pagination'
import { HomeShimmer } from '~/interface/shimmer/HomeShimmer'
import { H5 } from '~/interface/text/Headings'

export const FeedContent = memo(() => {
  const { posts, isLoading, hasMore, currentPage, nextPage, prevPage } =
    usePostsPaginated(10)

  return (
    <>
      <HeadInfo
        title="Feed"
        description="See what's happening on Takeout"
        openGraph={{
          images: [
            {
              url: `${process.env.ONE_SERVER_URL}/api/og?type=index`,
              width: 1200,
              height: 630,
            },
          ],
        }}
      />
      <AnimatePresence>
        {isLoading && (
          <YStack
            key="home-shimmer"
            transition="medium"
            enterStyle={{
              opacity: 0,
            }}
            exitStyle={{
              opacity: 0,
            }}
            z={999}
            position="absolute"
            t={60}
            l={0}
            r={0}
            b={0}
          >
            <HomeShimmer />
          </YStack>
        )}
      </AnimatePresence>

      <FloatingCreateButton />

      <YStack
        transition="medium"
        enterStyle={{
          opacity: 0,
        }}
        exitStyle={{
          opacity: 0,
        }}
        position="relative"
        flex={1}
        flexBasis="auto"
        bg="$background"
        width="100vw"
        ml="50%"
        transform="translateX(-50%)"
      >
        <YStack pb="$10" gap="$4" mx="auto" px="$4" width="100%" $xl={{ maxW: 760 }}>
          {!isLoading && posts.length === 0 ? (
            <YStack p="$4" items="center" justify="center" mt="$4">
              <H5 select="none">No posts yet</H5>
            </YStack>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              <Pagination
                currentPage={currentPage}
                hasMore={hasMore}
                onPrevPage={prevPage}
                onNextPage={nextPage}
              />
            </>
          )}
        </YStack>
      </YStack>
    </>
  )
})
