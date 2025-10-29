import { Image } from 'expo-image'
import { router, useParams } from 'one'
import { useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  type Input,
  SizableText,
  TextArea,
  useWindowDimensions,
  View,
  YStack,
} from 'tamagui'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { BasicHeader } from '~/interface/headers/BasicHeader'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { showToast } from '~/interface/toast/helpers'
import { useQuery, zero } from '~/zero/client'

export const PostEditPage = () => {
  const { postId } = useParams<{ postId: string }>()
  const textAreaRef = useRef<Input>(null)
  const { bottom } = useSafeAreaInsets()
  const [captionText, setCaptionText] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const { width } = useWindowDimensions()

  const [post] = useQuery(zero.query.post.where('id', postId || '').one(), {
    enabled: Boolean(postId),
  })

  useEffect(() => {
    if (post?.caption) {
      setCaptionText(post.caption)
    }
  }, [post?.caption])

  const hasUnsavedChanges = () => {
    return captionText.trim() !== (post?.caption || '').trim()
  }

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave without saving?',
        [
          {
            text: 'Stay',
            style: 'cancel',
          },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ],
        { cancelable: true }
      )
    } else {
      router.back()
    }
  }

  const handleSave = async () => {
    if (!post || !postId) return

    setIsSaving(true)
    try {
      await zero.mutate.post.update({
        id: postId,
        caption: captionText.trim(),
      })

      showToast('Caption updated', { type: 'success' })
      router.back()
    } catch (error) {
      console.error('Error updating caption:', error)
      showToast('Failed to update caption', { type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View flex={1} bg="$color1">
      <BasicHeader title="Edit Post" BackIcon={CaretLeftIcon} onClose={handleBack} />

      <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
        <YStack flex={1} px={14}>
          <SizableText size="$3" color="$color11" fontWeight="600" mb="$2">
            Post image
          </SizableText>
          {post?.image && (
            <Animated.View entering={FadeIn.duration(300)}>
              <YStack
                rounded="$6"
                overflow="hidden"
                width={width - 28}
                height={width - 28}
                bg="$color2"
                mb="$3"
              >
                <Image
                  source={post.image}
                  style={{ width: '100%', height: '100%' }}
                  transition={200}
                />
              </YStack>
            </Animated.View>
          )}

          <SizableText size="$3" color="$color11" fontWeight="600" mb="$2">
            Caption
          </SizableText>
          <YStack>
            <TextArea
              ref={textAreaRef}
              verticalAlign="top"
              rows={6}
              size="$4"
              fontWeight="500"
              placeholder="Enter a caption..."
              rounded={12}
              bg="$color2"
              borderColor="$color6"
              value={captionText}
              onChangeText={setCaptionText}
            />
          </YStack>
        </YStack>
      </KeyboardAwareScrollView>

      <View px="$4" pb={bottom + 8} pt="$2">
        <ButtonSimple
          onPress={handleSave}
          disabled={!captionText.trim() || captionText.trim() === post?.caption}
          variant="default"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </ButtonSimple>
      </View>
    </View>
  )
}
