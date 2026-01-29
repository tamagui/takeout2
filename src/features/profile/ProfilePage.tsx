import { memo } from 'react'
import { Spinner, YStack } from 'tamagui'

import { useUser } from '~/hooks/useUser'
import { HeadInfo } from '~/interface/app/HeadInfo'
import { Pressable } from '~/interface/buttons/Pressable'
import { galleryEmitter } from '~/interface/gallery/galleryEmitter'
import { Image } from '~/interface/image/Image'
import { SimpleGrid, SimpleGridItem } from '~/interface/layout/SimpleGrid'
import { Pagination } from '~/interface/navigation/Pagination'
import { H5 } from '~/interface/text/Headings'

import { ProfileHeader } from './ProfileHeader'
import { useProfilePosts } from './useProfilePosts'

import type { ProfilePageProps } from './types'

export const ProfilePage = memo(({ userId, isOwnProfile }: ProfilePageProps) => {
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

  const title = user?.username ? `@${user.username}` : 'Profile'
  const description = user?.name
    ? `${user.name} (@${user.username}) on Takeout`
    : user?.username
      ? `@${user.username} on Takeout`
      : undefined
  const ogImage = user?.image
    ? {
        images: [{ url: user.image as string, width: 1200, height: 630 }],
      }
    : undefined

  return (
    <>
      <HeadInfo title={title} description={description} openGraph={ogImage} />

      <YStack px="$4" pb="$10" maxW={760} mx="auto">
        <ProfileHeader
          userInfo={user}
          isOwnProfile={isOwnProfile}
          postsCount={postsCount}
        />

        {isLoading && !posts?.length ? (
          <YStack p="$6" items="center" justify="center">
            <Spinner size="small" color="$color10" />
          </YStack>
        ) : posts && posts.length === 0 ? (
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
                <Spinner size="small" color="$color10" />
              </YStack>
            )}

            <Pagination
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
