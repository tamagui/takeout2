import { useCallback } from 'react'
import { Alert, FlatList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ListItem, Spinner, View, YStack } from 'tamagui'
import { images } from '~/constants/images'
import type { User } from '~/data/types'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { BasicHeader } from '~/interface/headers/BasicHeader'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { Image } from '~/interface/image/Image'
import { BodyText } from '~/interface/text/Body'
import { H5 } from '~/interface/text/Headings'
import { useBlockedUsers } from './useBlockedUsers'

export const ProfileBlockedUsersPage = () => {
  const { bottom } = useSafeAreaInsets()
  const {
    blockedUsers,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    unblockUser,
    isEmpty,
  } = useBlockedUsers()

  const handleUnblock = useCallback(
    (user: User) => {
      Alert.alert(
        'Unblock User',
        `Are you sure you want to unblock ${user.username}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Unblock',
            style: 'destructive',
            onPress: () => unblockUser(user.id),
          },
        ],
        { cancelable: true }
      )
    },
    [unblockUser]
  )

  const renderItem = useCallback(
    ({ item }: { item: User }) => (
      <ListItem bg="$background" hoverTheme pressTheme px="$4" py="$3">
        <Avatar image={item.image} size={44} mr="$3" />

        <YStack gap="$1" flex={1}>
          <BodyText color="$color10" fontSize="$3" numberOfLines={1}>
            @{item.username}
          </BodyText>
        </YStack>

        <ButtonSimple
          size="small"
          bg="$color3"
          onPress={() => handleUnblock(item)}
          rounded="$5"
          px="$3"
          py="$2"
        >
          Unblock
        </ButtonSimple>
      </ListItem>
    ),
    [handleUnblock]
  )

  const keyExtractor = useCallback((item: User) => item.id, [])

  const ListEmptyComponent = useCallback(
    () => (
      <YStack flex={1} items="center" justify="center" py="$8" gap="$3">
        <Image src={images.iconBoy} width={78} height={78} />
        <H5 color="$color10">No blocked users</H5>
      </YStack>
    ),
    []
  )

  const ListFooterComponent = useCallback(() => {
    if (!isLoadingMore) return null
    return (
      <View py="$4" items="center">
        <Spinner size="small" color="$color10" />
      </View>
    )
  }, [isLoadingMore])

  return (
    <YStack flex={1} bg="$background">
      <BasicHeader title="Blocked Users" BackIcon={CaretLeftIcon} />

      {isLoading ? (
        <YStack flex={1} items="center" justify="center">
          <Spinner size="large" color="$color10" />
        </YStack>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={isEmpty ? ListEmptyComponent : undefined}
          ListFooterComponent={ListFooterComponent}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => <View height={8} />}
          contentContainerStyle={{
            marginTop: 16,
            paddingBottom: bottom + 20,
          }}
        />
      )}
    </YStack>
  )
}
