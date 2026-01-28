import { LegendList } from '@legendapp/list'
import { isNative } from '@take-out/helpers'
import { memo, useCallback } from 'react'
import { Alert, RefreshControl } from 'react-native'
import { ListItem, ScrollView, SizableText, Spinner, View, YStack } from 'tamagui'

import { useBlockedUsers } from '~/features/profile/useBlockedUsers'
import { Avatar } from '~/interface/avatars/Avatar'
import { Button } from '~/interface/buttons/Button'
import { dialogConfirm } from '~/interface/dialogs/actions'
import { PageLayout } from '~/interface/pages/PageLayout'
import { Text } from '~/interface/text/Text'

import type { User } from '~/data/types'

const BlockedUserItem = memo(
  ({ user, onUnblock }: { user: User; onUnblock: (user: User) => void }) => {
    return (
      <ListItem
        bg="$background"
        hoverStyle={{ bg: '$color1' }}
        pressStyle={{ bg: '$color3' }}
        px="$4"
        py="$3"
      >
        <Avatar image={user.image} size={44} mr="$3" />

        <YStack gap="$1" flex={1}>
          <Text size="$3" color="$color10" numberOfLines={1}>
            @{user.username}
          </Text>
        </YStack>

        <Button
          size="small"
          bg="$color3"
          onPress={() => onUnblock(user)}
          rounded="$5"
          px="$3"
          py="$2"
        >
          Unblock
        </Button>
      </ListItem>
    )
  }
)

const EmptyState = memo(() => {
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
})

export const ProfileBlockedUsersPage = () => {
  const { blockedUsers, isLoading, hasMore, loadMore, refresh, unblockUser } =
    useBlockedUsers()

  const handleUnblock = useCallback(
    async (user: User) => {
      if (isNative) {
        Alert.alert(
          'Unblock User',
          `Are you sure you want to unblock ${user.username}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Unblock',
              style: 'destructive',
              onPress: () => unblockUser(user.id),
            },
          ],
          { cancelable: true }
        )
      } else {
        const confirmed = await dialogConfirm({
          title: 'Unblock User',
          description: `Are you sure you want to unblock ${user.username}?`,
        })
        if (confirmed) {
          unblockUser(user.id)
        }
      }
    },
    [unblockUser]
  )

  const renderItem = useCallback(
    ({ item }: { item: User }) => (
      <BlockedUserItem user={item} onUnblock={handleUnblock} />
    ),
    [handleUnblock]
  )

  const keyExtractor = useCallback((item: User) => item.id, [])

  const renderFooter = useCallback(() => {
    if (!hasMore || blockedUsers.length === 0) return null
    return (
      <YStack p="$4" items="center" justify="center">
        <Spinner size="small" />
      </YStack>
    )
  }, [hasMore, blockedUsers.length])

  if (isLoading) {
    return (
      <PageLayout>
        <YStack flex={1} items="center" justify="center">
          <Spinner size="large" color="$color10" />
        </YStack>
      </PageLayout>
    )
  }

  // web: use simple ScrollView to avoid LegendList style issues
  if (!isNative) {
    return (
      <PageLayout>
        <ScrollView
          flex={1}
          px="$4"
          showsVerticalScrollIndicator={false}
          transition="200ms"
          enterStyle={{ opacity: 0, y: 10 }}
        >
          {blockedUsers.length === 0 ? (
            <EmptyState />
          ) : (
            <YStack gap="$2">
              {blockedUsers.map((user) => (
                <BlockedUserItem key={user.id} user={user} onUnblock={handleUnblock} />
              ))}
              {renderFooter()}
            </YStack>
          )}
        </ScrollView>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <View flex={1} flexBasis="auto" px="$4">
        <LegendList
          data={blockedUsers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={EmptyState}
          ListFooterComponent={renderFooter}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingHorizontal: 14,
          }}
        />
      </View>
    </PageLayout>
  )
}
