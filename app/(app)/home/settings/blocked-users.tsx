import { LegendList } from '@legendapp/list'
import { isNative } from '@take-out/helpers'
import { useCallback } from 'react'
import { Alert, RefreshControl } from 'react-native'
import { ListItem, SizableText, Spinner, View, YStack } from 'tamagui'

import { useBlockedUsers } from '~/features/profile/useBlockedUsers'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { PageLayout } from '~/interface/pages/PageLayout'
import { Text } from '~/interface/text/Text'

import type { User } from '~/data/types'

export const ProfileBlockedUsersPage = () => {
  const { blockedUsers, isLoading, hasMore, loadMore, refresh, unblockUser } =
    useBlockedUsers()

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
      <ListItem
        bg="$background"
        hoverStyle={{ bg: '$color1' }}
        pressStyle={{ bg: '$color3' }}
        px="$4"
        py="$3"
      >
        <Avatar image={item.image} size={44} mr="$3" />

        <YStack gap="$1" flex={1}>
          <Text size="$3" color="$color10" numberOfLines={1}>
            @{item.username}
          </Text>
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

  const renderEmpty = useCallback(() => {
    return (
      <YStack flex={1} items="center" justify="center" p="$4" minH={400}>
        <SizableText size="$5" color="$color10">
          No blocked users
        </SizableText>

        {isNative && (
          <SizableText size="$3" color="$color10" mt="$2">
            Pull to refresh
          </SizableText>
        )}
      </YStack>
    )
  }, [])

  const renderFooter = useCallback(() => {
    if (!hasMore || blockedUsers.length === 0) return null
    return (
      <YStack p="$4" items="center" justify="center">
        <Spinner size="small" />
      </YStack>
    )
  }, [hasMore, blockedUsers.length])

  return (
    <PageLayout>
      <View flex={1} flexBasis="auto">
        {isLoading ? (
          <YStack flex={1} items="center" justify="center">
            <Spinner size="large" color="$color10" />
          </YStack>
        ) : (
          <LegendList
            data={blockedUsers}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              paddingHorizontal: 14,
            }}
          />
        )}
      </View>
    </PageLayout>
  )
}
