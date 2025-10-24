import { useEffect, useRef, useState } from 'react'
import { YStack } from 'tamagui'
import { UserListItemFriendable } from '~/features/user/ui/UserListItemFriendable'
import { useQuery, zero } from '~/zero/client'
import { addFriendEmitter } from './actions'
import { Dialog } from './Dialog'
import { useDialogEmit } from './shared'
import { LegendList } from '@legendapp/list'
import { Input } from '../forms/Input'

const cancel = () => addFriendEmitter.emit(false)

export const DialogAddFriend = () => {
  const [show, setShow] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [foundUsers] = useQuery(
    zero.query.userPublic
      .where((eq) =>
        eq.or(
          eq.cmp('username', 'ILIKE', `%${search}%`),
          eq.cmp('name', 'ILIKE', `%${search}%`)
        )
      )
      .limit(!search ? 10 : 10),
    Boolean(search)
  )

  useDialogEmit((next) => {
    if (next.type === 'add-friend') {
      setShow(true)
    } else {
      setShow(false)
      cancel()
    }
  })

  useEffect(() => {
    if (show) {
      inputRef.current?.focus()
    }
  }, [show])

  return (
    <Dialog minH={400} open={show} onOpenChange={setShow}>
      <Dialog.Header hidden title="Add friend" />

      <Input
        placeholder="Find people..."
        minH={50}
        onChangeText={setSearch}
        ref={inputRef as any}
        size="$5"
      />

      <YStack flex={1} py="$3">
        <LegendList
          data={foundUsers}
          estimatedItemSize={50}
          renderItem={({ item: user }) => (
            <UserListItemFriendable key={user.id} user={user} />
          )}
          keyExtractor={(user) => user.id}
        />
      </YStack>
    </Dialog>
  )
}
