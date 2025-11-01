import { useRouter } from 'one'
import { memo } from 'react'
import { useWindowDimensions, XStack, YStack } from 'tamagui'
import { images } from '~/constants/images'
import type { User } from '~/data/types'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Image } from '~/interface/image/Image'
import { MediumText, TinyText } from '~/interface/text/Body'

interface CardItemProps {
  icon: string
  title: string
  description: string
  buttonText: string
  onPress: () => void
  width: number
  height: number
}

const CardItem = memo(
  ({ icon, title, description, buttonText, onPress, width, height }: CardItemProps) => {
    return (
      <YStack
        width={width}
        height={height}
        bg="$color2"
        rounded="$5"
        p="$3"
        gap="$2"
        justify="space-between"
      >
        <Image src={icon} width={28} height={28} />
        <MediumText color="$color12">{title}</MediumText>
        <TinyText color="$color9" numberOfLines={2}>
          {description}
        </TinyText>
        <ButtonSimple onPress={onPress} size="small">
          {buttonText}
        </ButtonSimple>
      </YStack>
    )
  }
)

interface ProfileCompletionCardsProps {
  userInfo: User
  postsCount: number
}

export const ProfileCompletionCards = memo(
  ({ userInfo, postsCount }: ProfileCompletionCardsProps) => {
    const router = useRouter()
    const hasNoPosts = postsCount === 0
    const hasNoDisplayName = !userInfo?.name || userInfo.name.trim() === ''

    const { width } = useWindowDimensions()

    const CARD_SIZE = (width - 36) / 2

    const showCompletionCards = hasNoPosts || hasNoDisplayName

    if (!showCompletionCards) {
      return null
    }

    return (
      <YStack py="$4" px={14} gap="$3">
        <YStack gap="$1" mb="$3">
          <MediumText color="$color12">Complete your profile</MediumText>
          <TinyText color="$color9">Just a few things to do to get you ready!</TinyText>
        </YStack>
        <XStack gap={8} flexWrap="wrap">
          {hasNoPosts && (
            <CardItem
              icon={images.iconPicture}
              title="Create content"
              description="Make your first post by editing in the content studio."
              buttonText="Create content"
              onPress={() => router.push('/studio/create-content')}
              width={CARD_SIZE}
              height={CARD_SIZE * 0.9}
            />
          )}
          {hasNoDisplayName && (
            <CardItem
              icon={images.iconPencil}
              title="Edit name"
              description="Allow people to discover you by your real name or anything."
              buttonText="Edit name"
              onPress={() => router.push('user/profile-edit')}
              width={CARD_SIZE}
              height={CARD_SIZE * 0.9}
            />
          )}
        </XStack>
      </YStack>
    )
  }
)
