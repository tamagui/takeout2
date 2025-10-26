import { router, useParams } from 'one'
import { useEffect, useState } from 'react'
import { ScrollView, SizableText, TextArea, View, YStack } from 'tamagui'
import { showErrorSheet } from '~/interface/sheet/errorSheetHelper'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { BasicHeader } from '~/interface/headers/BasicHeader'
import { Image } from '~/interface/image/Image'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { showToast } from '~/interface/toast/helpers'
import { useQuery, zero } from '~/zero/client'

export const PostEditPage = () => {
  const { postId } = useParams<{ postId: string }>()
  const [caption, setCaption] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch the post data
  const [post] = useQuery(zero.query.post.where('id', postId || '').one(), {
    enabled: Boolean(postId),
  })

  useEffect(() => {
    if (post) {
      setCaption(post.caption || '')
    }
  }, [post])

  const hasUnsavedChanges = () => {
    return caption.trim() !== (post?.caption || '').trim()
  }

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      showErrorSheet({
        title: 'Unsaved Changes',
        description:
          'You have unsaved changes. Are you sure you want to leave without saving?',
        buttonText: 'Leave',
        cancelText: 'Stay',
        buttonAction: () => {
          router.back()
        },
      })
    } else {
      router.back()
    }
  }

  const handleSave = async () => {
    if (!post || !postId) return

    setIsLoading(true)
    try {
      // Update the post
      await zero.mutate.post.update({
        id: postId,
        caption: caption,
      })

      showToast('Post updated successfully', { type: 'success' })
      router.back()
    } catch (error) {
      console.error('Failed to update post:', error)
      showToast('Failed to update post', { type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  if (!post) {
    return (
      <YStack flex={1} bg="$background">
        <BasicHeader title="Edit Post" BackIcon={CaretLeftIcon} />
        <View flex={1} items="center" justify="center">
          <SizableText color="$color10">Loading...</SizableText>
        </View>
      </YStack>
    )
  }

  return (
    <YStack flex={1} bg="$background">
      <BasicHeader title="Edit Post" BackIcon={CaretLeftIcon} onClose={handleBack} />

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack p="$4" gap="$4">
          {/* Post Image */}
          {post.image && (
            <View rounded="$4" overflow="hidden">
              <Image src={post.image} width="100%" height={300} objectFit="cover" />
            </View>
          )}

          {/* Caption Editor */}
          <YStack gap="$2">
            <SizableText size="$2" color="$color10" fontWeight="600">
              CAPTION
            </SizableText>
            <TextArea
              value={caption}
              verticalAlign="top"
              onChangeText={setCaption}
              placeholder="Write a caption..."
              height={120}
              bg="$color2"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$3"
              p="$3"
              fontSize="$4"
              disabled={isLoading}
            />
            <SizableText size="$1" color="$color9" text="right">
              {caption.length} characters
            </SizableText>
          </YStack>

          {/* Save Button */}
          <ButtonSimple
            size="large"
            theme="accent"
            disabled={isLoading || caption.length < 1 || caption === (post.caption || '')}
            onPress={handleSave}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </ButtonSimple>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
