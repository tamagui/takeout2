import { memo } from 'react'
import { IndentIncrease } from '@tamagui/lucide-icons'
import { ScrollView, Theme, View, YStack } from 'tamagui'
import { useCurrentChannelThreads } from '~/features/channel/useCurrentChannelThreads'
import { useCurrentServer } from '~/features/server/useCurrentServer'
import { animationClamped } from '../animations/animationClamped'
import { ListTitle } from '../lists/ListTitle'
import { ThreadListItem } from './ThreadListItem'

export const SidebarThreads = memo(() => {
  const { channel } = useCurrentServer()
  const threads = useCurrentChannelThreads()

  return (
    <YStack
      {...(!!threads.length && {
        flex: 200,
        minH: 200,
        mt: 15,
        bg: '$background02',
        m: '$2',
        py: '$4',
        px: '$2',
        rounded: '$5',
      })}
    >
      <ListTitle animation={animationClamped('lazy')} opacity={threads.length ? 1 : 0}>
        <ListTitle.Text mr="auto">#{channel?.name}</ListTitle.Text>
        <ListTitle.Icon>
          <IndentIncrease />
        </ListTitle.Icon>
      </ListTitle>
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack>
          {threads.map((thread) => (
            <ThreadListItem key={thread.id} thread={thread} />
          ))}
          <View pointerEvents="none" height={100} width={20} />
        </YStack>
      </ScrollView>
    </YStack>
  )
})
