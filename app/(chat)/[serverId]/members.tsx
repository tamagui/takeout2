import { memo, useCallback } from 'react'
import { EnsureFlexed, YStack } from 'tamagui'
import { UserListItem } from '~/features/user/ui/UserListItem'
import { SearchableInput, useSearchableList } from '~/interface/searchable-list'
import { useCurrentServer } from '~/features/server/useCurrentServer'
import type { UserWithState } from '~/data/types'
import { MESSAGE_MAX_WIDTH_CALC, TOP_BAR_HEIGHT } from '~/interface/constants'

export const MembersPage = memo(() => {
  const { members } = useCurrentServer()

  const { handle, filteredItems, Provider } = useSearchableList<UserWithState>({
    items: members || [],
    searchKey: ['username', 'name'],
  })

  const renderMember = useCallback(
    (user: UserWithState, index: number) => (
      <UserListItem key={user.id} user={user} size="large" fontFamily="$body" />
    ),
    []
  )

  return (
    <YStack overflow="hidden" flex={1} pt={TOP_BAR_HEIGHT} items="center">
      <YStack flex={1} maxW={MESSAGE_MAX_WIDTH_CALC}>
        <EnsureFlexed />
        <Provider handle={handle}>
          <YStack flex={1} items="center" py="$6">
            <YStack width="100%" maxW={600} gap="$4">
              <SearchableInput autoFocus size="$5" placeholder="Search members..." />

              <YStack gap="$2">{filteredItems.map(renderMember)}</YStack>
            </YStack>
          </YStack>
        </Provider>
      </YStack>
    </YStack>
  )
})
