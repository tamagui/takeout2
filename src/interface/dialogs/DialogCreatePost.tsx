import { randomId, useEmitterSelector } from '@take-out/helpers'
import { useRef, useState } from 'react'
import { KeyboardController } from 'react-native-keyboard-controller'
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

import { Button } from '../buttons/Button'
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
  const uploadError = latestUpload?.status === 'error' ? latestUpload.error : undefined
  const uploadedUrl = latestUpload?.url
  const previewUrl = latestUpload?.preview

  const handleSelectImage = () => {
    if (isWeb) {
      fileInputRef.current?.click()
    } else {
      KeyboardController.dismiss()

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

    const trimmedCaption = caption.trim() || undefined
    const imageUrl = uploadedUrl || ''
    const postId = randomId()

    setIsPosting(true)
    try {
      await zero.mutate.post.insert({
        id: postId,
        userId,
        caption: trimmedCaption,
        image: imageUrl,
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

  const content = (
    <YStack p="$2" gap="$4">
      <Dialog.Header title="Create Post" />

      <YStack gap="$4" mb="$4">
        <TextArea
          verticalAlign="top"
          maxLength={6000}
          rows={3}
          size="large"
          placeholder="What's on your mind?"
          value={caption}
          onChangeText={(val) => setCaption(val)}
          autoFocus={isWeb}
          enterKeyHint="done"
          submitBehavior="blurAndSubmit"
          data-testid="create-post-caption"
        />

        {previewUrl && (
          <YStack position="relative" rounded="$6" overflow="hidden">
            <Image
              src={previewUrl}
              aspectRatio={1}
              objectFit="contain"
              bg="$background04"
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
            {uploadError && (
              <YStack
                position="absolute"
                t={0}
                l={0}
                r={0}
                b={0}
                bg="$red3"
                opacity={0.9}
                items="center"
                justify="center"
                p="$4"
              >
                <SizableText size="$5" fontWeight="600" color="$red11">
                  Upload failed
                </SizableText>
                <SizableText mt="$2" size="$3" color="$red10">
                  {uploadError}
                </SizableText>
              </YStack>
            )}
            {!isUploading && !uploadError && (
              <Pressable position="absolute" t="$3" r="$3" onPress={handleRemoveImage}>
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
              borderColor="$color2"
              borderStyle="dashed"
              rounded="$6"
              p="$6"
              items="center"
              justify="center"
              gap="$3"
              bg="$background02"
            >
              <Circle size={56} bg="$background04" items="center" justify="center">
                <ImageIcon size={28} color="$color11" />
              </Circle>
              <YStack items="center" gap="$2">
                <SizableText size="$5" fontWeight="600">
                  Add Image
                </SizableText>
                <SizableText size="$3" color="$color">
                  {isWeb ? 'Click to select' : 'Tap to select from library'}
                </SizableText>
              </YStack>
            </YStack>
          </Pressable>
        )}
      </YStack>

      <Dialog.Footer>
        <Button glass onPress={handleClose}>
          Cancel
        </Button>
        <Button
          theme="accent"
          glass
          onPress={handlePost}
          disabled={!canPost}
          data-testid="create-post-submit"
        >
          {isPosting ? 'Posting...' : 'Post'}
        </Button>
      </Dialog.Footer>
    </YStack>
  )

  return (
    <Dialog
      minH={500}
      minW={minW}
      open={!!state}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      {!isWeb ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {content}
        </ScrollView>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleWebFileChange}
            data-testid="create-post-file-input"
          />
          <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView>
        </>
      )}
    </Dialog>
  )
}
