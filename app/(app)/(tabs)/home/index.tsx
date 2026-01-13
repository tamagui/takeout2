import { memo } from 'react'
import { AnimatePresence, Spinner, YStack } from 'tamagui'

import { HomePagination } from '~/features/feed/HomePagination'
import { PostCard } from '~/features/feed/PostCard'
import { usePostsPaginated } from '~/features/feed/usePosts'
import { HomeShimmer } from '~/interface/shimmer/HomeShimmer'
import { H5 } from '~/interface/text/Headings'

export const HomePage = memo(() => {
  const { posts, isLoading, hasMore, currentPage, nextPage, prevPage } =
    usePostsPaginated(10)

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <YStack
            key="home-shimmer"
            transition="200ms"
            exitStyle={{
              opacity: 0,
            }}
            opacity={1}
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

      <YStack
        position="relative"
        flexBasis="auto"
        bg="$background"
        width="100vw"
        ml="50%"
        transform="translateX(-50%)"
      >
        <YStack pb="$10" gap="$4" mx="auto" px="$4" width="100%" $xl={{ maxW: 760 }}>
          {!isLoading && posts.length === 0 ? (
            <YStack p="$4" items="center" justify="center" mt="$4">
              <H5>No posts yet</H5>
            </YStack>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {isLoading && (
                <YStack p="$4" items="center" justify="center">
                  <Spinner size="small" />
                </YStack>
              )}

              <HomePagination
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
