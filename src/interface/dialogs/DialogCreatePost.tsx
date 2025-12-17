import { randomId, useEmitterSelector } from '@take-out/helpers'
import { useRef, useState } from 'react'
import {
  Circle,
  isWeb,
  ScrollView,
  SizableText,
  Spinner,
  useWindowDimensions,
  YStack,
} from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { pickImageFromLibrary } from '~/helpers/media/imagePicker'
import { zero } from '~/zero/client'

import { ButtonSimple } from '../buttons/ButtonSimple'
import { Pressable } from '../buttons/Pressable'
import { TextArea } from '../forms/TextArea'
import { ImageIcon } from '../icons/phosphor/ImageIcon'
import { XIcon } from '../icons/phosphor/XIcon'
import { Image } from '../image/Image'
import { showToast } from '../toast/helpers'
import { useUploadFiles } from '../upload/uploadFile'
import { showError } from './actions'
import { Dialog } from './Dialog'
import { closeDialog, dialogEmitter } from './shared'

const MAX_IMAGE_SIZE = 1200
const IMAGE_QUALITY = 0.9

export const DialogCreatePost = () => {
  const auth = useAuth()
  const userId = auth.user?.id
  const { width } = useWindowDimensions()
  const minW = isWeb ? 500 : width * 0.9
  const [caption, setCaption] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const state = useEmitterSelector(dialogEmitter, (next) => {
    return next.type === 'create-post' ? next : null
  })

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

  const handleClose = () => {
    setCaption('')
    clear()
    closeDialog()
  }

  const handlePost = async () => {
    if (!userId) {
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
        userId,
        caption: caption.trim() || undefined,
        image: uploadedUrl || '',
        hiddenByAdmin: false,
        commentCount: 0,
        createdAt: Date.now(),
      })

      showToast('Post created successfully!', { type: 'success' })
      handleClose()
      setIsPosting(false)
    } catch (error) {
      console.info('Failed to create post:', error)
      showError(error, 'Failed to create post')
      setIsPosting(false)
    }
  }

  const canPost = caption.trim() && uploadedUrl && !isUploading && !isPosting

  return (
    <Dialog
      minH={500}
      minW={minW}
      open={!!state}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      {isWeb && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleWebFileChange}
          data-testid="create-post-file-input"
        />
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap="$4">
          <Dialog.Header title="Create Post" hidden />

          <SizableText size="$6" fontWeight="700">
            Create Post
          </SizableText>

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
              data-testid="create-post-caption"
            />

            {previewUrl && (
              <YStack position="relative" rounded="$6" overflow="hidden">
                <Image
                  src={previewUrl}
                  width="100%"
                  aspectRatio={1}
                  objectFit="contain"
                  bg="$color2"
                />
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
                  <Pressable
                    position="absolute"
                    t="$3"
                    r="$3"
                    onPress={handleRemoveImage}
                  >
                    <Circle size={36} bg="$background" items="center" justify="center">
                      <XIcon size={20} color="$color11" />
                    </Circle>
                  </Pressable>
                )}
              </YStack>
            )}

            {!previewUrl && (
              <Pressable
                onPress={handleSelectImage}
                disabled={isUploading}
                data-testid="create-post-image-picker"
              >
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

          <Dialog.Footer>
            <ButtonSimple glass onPress={handleClose}>
              Cancel
            </ButtonSimple>
            <ButtonSimple
              glass
              onPress={handlePost}
              disabled={!canPost}
              data-testid="create-post-submit"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </ButtonSimple>
          </Dialog.Footer>
        </YStack>
      </ScrollView>
    </Dialog>
  )
}
