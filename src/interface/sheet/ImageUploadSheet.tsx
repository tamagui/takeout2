import {
  PermissionStatus,
  useCameraPermissions,
  useMediaLibraryPermissions,
} from 'expo-image-picker'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { YStack } from 'tamagui'
import { pickImageFromLibrary, takePhotoWithCamera } from '~/helpers/media/imagePicker'
import { CameraIcon } from '~/interface/icons/phosphor/CameraIcon'
import { ImageIcon } from '~/interface/icons/phosphor/ImageIcon'
import { ListItem } from '~/interface/lists/ListItem'
import { Sheet, type SheetRef } from '~/interface/sheet/Sheet'

export interface ImageUploadSheetRef {
  show: (
    onImageSelected: (imageUri: string, imageData: any) => void,
    allowsEditing?: boolean
  ) => void
  hide: () => void
}

export const ImageUploadSheet = forwardRef<ImageUploadSheetRef>((_, ref) => {
  const sheetRef = useRef<SheetRef>(null)
  const [onImageSelected, setOnImageSelected] = useState<
    ((uri: string, data: any) => void) | null
  >(null)
  const [allowsEditing, setAllowsEditing] = useState(true)
  const [cameraStatus] = useCameraPermissions()
  const [mediaStatus] = useMediaLibraryPermissions()

  useImperativeHandle(ref, () => ({
    show: (callback, editing = true) => {
      setOnImageSelected(() => callback)
      setAllowsEditing(editing)
      sheetRef.current?.expand()
    },
    hide: () => {
      sheetRef.current?.collapse()
      setOnImageSelected(null)
      setAllowsEditing(true)
    },
  }))

  const handleChooseImage = async (type: 'camera' | 'library') => {
    sheetRef.current?.collapse()

    if (type === 'camera' && cameraStatus?.status === PermissionStatus.DENIED) {
      Alert.alert(
        'Camera Access Required',
        'This feature requires camera access. You can enable it in your device settings.',
        [
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      )
      return
    }
    if (type === 'library' && mediaStatus?.status === PermissionStatus.DENIED) {
      Alert.alert(
        'Photo Access Required',
        'This feature requires photo access. You can enable it in your device settings.',
        [
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      )
      return
    }

    const imageResult =
      type === 'camera'
        ? await takePhotoWithCamera(allowsEditing)
        : await pickImageFromLibrary(allowsEditing)

    if (imageResult && !imageResult.canceled && imageResult.assets?.[0]) {
      const asset = imageResult.assets[0]

      // create a pseudo-file object for native
      const pseudoFile = {
        uri: asset.uri,
        name: asset.fileName || `avatar-${Date.now()}.jpg`,
        type: asset.mimeType || asset.type || 'image/jpeg',
        size: asset.fileSize || 0,
        lastModified: Date.now(),
      } as any

      onImageSelected?.(asset.uri, pseudoFile)
      setOnImageSelected(null)
    }
  }

  const handleClose = () => {
    setOnImageSelected(null)
    setAllowsEditing(true)
  }

  const avatarOptions = [
    { icon: CameraIcon, label: 'Camera', onPress: () => handleChooseImage('camera') },
    {
      icon: ImageIcon,
      label: 'Photos',
      onPress: () => handleChooseImage('library'),
    },
  ]

  return (
    <Sheet ref={sheetRef} title="Select Photo" onClose={handleClose}>
      <YStack gap="$2">
        {avatarOptions.map(({ icon: Icon, label, onPress }) => (
          <ListItem
            key={label}
            onPress={onPress}
            size="large"
            bg="$color3"
            pressStyle={{ bg: '$color2' }}
            height={50}
          >
            <Icon size={22} color="$color10" />
            <ListItem.Text fontWeight="600" color="$color">
              {label}
            </ListItem.Text>
          </ListItem>
        ))}
      </YStack>
    </Sheet>
  )
})
