import { randomId } from '@take-out/helpers'
import { router, useFocusEffect } from 'one'
import { memo, useRef, useState } from 'react'
import {
  Circle,
  Dialog,
  isWeb,
  ScrollView,
  SizableText,
  Spinner,
  XStack,
  YStack,
} from 'tamagui'

import { useUser } from '~/features/user/useUser'
import { pickImageFromLibrary } from '~/helpers/media/imagePicker'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Pressable } from '~/interface/buttons/Pressable'
import { showError } from '~/interface/dialogs/actions'
import { TextArea } from '~/interface/forms/TextArea'
import { ImageIcon } from '~/interface/icons/phosphor/ImageIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { Image } from '~/interface/image/Image'
import { showToast } from '~/interface/toast/helpers'
import { useUploadFiles } from '~/interface/upload/uploadFile'
import { zero } from '~/zero/client'

const MAX_IMAGE_SIZE = 1200
const IMAGE_QUALITY = 0.9

export const PlusPage = memo(() => {
  const { user } = useUser()
  const [caption, setCaption] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [open, setOpen] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { uploads, handleUpload, clear } = useUploadFiles({
    resize: {
      maxWidth: MAX_IMAGE_SIZE,
      maxHeight: MAX_IMAGE_SIZE,
      quality: IMAGE_QUALITY,
      maxSizeInBytes: 5000 * 1024,
    },
  })

  const latestUpload = uploads[uploads.length - 1]
  const isUploading = latestUpload?.status === 'uploading'
  const uploadedUrl = latestUpload?.url
  const previewUrl = latestUpload?.preview

  const handleSelectImage = () => {
    if (isWeb) {
      fileInputRef.current?.click()
    } else {
      pickImageFromLibrary(false).then((result) => {
        if (result && !result.canceled && result.assets?.[0]) {
          const asset = result.assets[0]
          // native pseudo-file with uri property - handled specially by uploadFile.ts
          const pseudoFile = {
            uri: asset.uri,
            name: asset.fileName || `image-${Date.now()}.jpg`,
            type: asset.mimeType || asset.type || 'image/jpeg',
            size: asset.fileSize || 0,
            lastModified: Date.now(),
          } as unknown as File
          handleUpload([pseudoFile])
        }
      })
    }
  }

  const handleWebFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload([file])
    }
  }

  const handleRemoveImage = () => {
    clear()
  }

  const handlePost = async () => {
    if (!user?.id) {
      showError('You must be logged in to post')
      return
    }

    if (!caption.trim() && !uploadedUrl) {
      showError('Please add a caption or image')
      return
    }

    setIsPosting(true)
    try {
      await zero.mutate.post.insert({
        id: randomId(),
        userId: user.id,
        caption: caption.trim() || undefined,
        image: uploadedUrl || '',
        hiddenByAdmin: false,
        createdAt: Date.now(),
      })

      showToast('Post created successfully!', { type: 'success' })
      setCaption('')
      clear()
      setOpen(false)
      router.back()
    } catch (error) {
      console.info('Failed to create post:', error)
      showError(error, 'Failed to create post')
    } finally {
      setIsPosting(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      router.back()
    }
  }

  useFocusEffect(() => {
    setOpen(true)
  }, [])

  const canPost = caption.trim() && uploadedUrl && !isUploading && !isPosting

  const contentUI = (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$4" p="$3">
        <XStack justify="space-between" items="center">
          <SizableText size="$6" fontWeight="700">
            Create Post
          </SizableText>
          <ButtonSimple glass circular onPress={() => handleOpenChange(false)}>
            <XIcon size={20} color="$color11" />
          </ButtonSimple>
        </XStack>

        <YStack gap="$3">
          <TextArea
            verticalAlign="top"
            maxLength={6000}
            rows={3}
            size="$4"
            placeholder="What's on your mind?"
            value={caption}
            onChangeText={setCaption}
            autoFocus={isWeb}
            rounded="$6"
          />

          {previewUrl && (
            <YStack position="relative" rounded="$6" overflow="hidden">
              <Image src={previewUrl} width="100%" height={300} />
              {isUploading && (
                <YStack
                  position="absolute"
                  t={0}
                  l={0}
                  r={0}
                  b={0}
                  bg="$background"
                  opacity={0.8}
                  items="center"
                  justify="center"
                >
                  <Spinner size="large" />
                  <SizableText mt="$2" size="$3">
                    Uploading...
                  </SizableText>
                </YStack>
              )}
              {!isUploading && (
                <Pressable position="absolute" t="$3" r="$3" onPress={handleRemoveImage}>
                  <Circle size={36} bg="$background" items="center" justify="center">
                    <XIcon size={20} color="$color11" />
                  </Circle>
                </Pressable>
              )}
            </YStack>
          )}

          {!previewUrl && (
            <Pressable onPress={handleSelectImage} disabled={isUploading}>
              <YStack
                borderWidth={2}
                borderColor="$color5"
                borderStyle="dashed"
                rounded="$6"
                p="$6"
                items="center"
                justify="center"
                gap="$3"
                bg="$color2"
              >
                <Circle size={56} bg="$color4" items="center" justify="center">
                  <ImageIcon size={28} color="$color11" />
                </Circle>
                <YStack items="center" gap="$1">
                  <SizableText size="$5" fontWeight="600">
                    Add Image
                  </SizableText>
                  <SizableText size="$3" color="$color10">
                    {isWeb ? 'Click to select' : 'Tap to select from library'}
                  </SizableText>
                </YStack>
              </YStack>
            </Pressable>
          )}
        </YStack>

        <ButtonSimple glass size="large" onPress={handlePost} disabled={!canPost}>
          {isPosting ? 'Posting...' : 'Post'}
        </ButtonSimple>
      </YStack>
    </ScrollView>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal>
      {isWeb && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleWebFileChange}
        />
      )}
      {/* Todo: Hide it atm because content doesn't show on first render on native */}
      {/* <Adapt when="maxMD" platform="touch">
        <Sheet
          animation="300ms"
          zIndex={200000}
          modal
          dismissOnSnapToBottom
          snapPoints={[90]}
          unmountChildrenWhenHidden
        >
          <Sheet.Frame p="$4" gap="$4" bg="$color2">
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay
            animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Sheet>
      </Adapt> */}
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          maxW={600}
          width="90%"
          maxH="85vh"
          p={0}
        >
          {contentUI}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
})
