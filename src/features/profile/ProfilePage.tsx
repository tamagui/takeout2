import { memo } from 'react'
import { AnimatePresence, Spinner, YStack } from 'tamagui'

import { useHeaderHeightSafe } from '~/hooks/useHeaderHeightSafe'
import { useUser } from '~/hooks/useUser'
import { Pressable } from '~/interface/buttons/Pressable'
import { galleryEmitter } from '~/interface/gallery/galleryEmitter'
import { Image } from '~/interface/image/Image'
import { SimpleGrid, SimpleGridItem } from '~/interface/layout/SimpleGrid'
import { ProfileShimmer } from '~/interface/shimmer/ProfileShimmer'
import { H5 } from '~/interface/text/Headings'

import { ProfileHeader } from './ProfileHeader'
import { ProfilePagination } from './ProfilePagination'
import { useProfilePosts } from './useProfilePosts'

import type { ProfilePageProps } from './types'

export const ProfilePage = memo(({ userId, isOwnProfile }: ProfilePageProps) => {
  const headerHeight = useHeaderHeightSafe()

  const [user] = useUser(userId)
  const { posts, isLoading, currentPage, hasMore, nextPage, prevPage } = useProfilePosts({
    userId,
    pageSize: 12,
  })

  const postsCount = posts?.length || 0

  const handleImagePress = (postId: string) => {
    galleryEmitter.emit({
      items:
        posts?.map((post) => ({
          id: post.id.toString(),
          url: post.image,
        })) || [],
      firstItem: postId,
    })
  }

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <YStack
            key="studio-shimmer"
            transition="200ms"
            pt={headerHeight}
            exitStyle={{
              opacity: 0,
            }}
            opacity={1}
            z={999}
            position="absolute"
            t={10}
            l={0}
            r={0}
            b={0}
          >
            <ProfileShimmer />
          </YStack>
        )}
      </AnimatePresence>

      <YStack px="$4" pb="$10">
        <ProfileHeader
          userInfo={user}
          isOwnProfile={isOwnProfile}
          postsCount={postsCount}
        />

        {!isLoading && posts && posts.length === 0 ? (
          <YStack p="$4" items="center" justify="center" mt="$4">
            <H5 mt="$3">No posts yet</H5>
          </YStack>
        ) : (
          <>
            <SimpleGrid gap="$2">
              {posts?.map((post) => (
                <SimpleGridItem key={post.id} columns={3}>
                  <Pressable onPress={() => handleImagePress(post.id.toString())}>
                    <Image
                      src={post.image}
                      width="100%"
                      aspectRatio={1}
                      rounded="$3"
                      objectFit="cover"
                    />
                  </Pressable>
                </SimpleGridItem>
              ))}
            </SimpleGrid>

            {isLoading && (
              <YStack p="$4" items="center" justify="center">
                <Spinner size="small" />
              </YStack>
            )}

            <ProfilePagination
              currentPage={currentPage}
              hasMore={hasMore}
              onPrevPage={prevPage}
              onNextPage={nextPage}
            />
          </>
        )}
      </YStack>
    </>
  )
})
