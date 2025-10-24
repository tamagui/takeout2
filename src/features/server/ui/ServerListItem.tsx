import { Check, DoorOpen } from '@tamagui/lucide-icons'
import { XStack } from 'tamagui'
import { toggleJoinServer } from '~/features/user/useJoinServer'
import { Link } from '~/interface/app/Link'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { ListItem, type ListItemProps } from '~/interface/lists/ListItem'
import { getSimpleSize } from '~/interface/sizes'
import type { ServerWithMembership } from '~/data/types'

export const ServerListItem = ({
  server,
  link,
  size,
  ...props
}: ListItemProps & { link?: boolean; server: ServerWithMembership }) => {
  const hasJoined = !!server.member

  const content = (
    <ListItem className={`server-item-${server.id}`} size={size || 'medium'} {...props}>
      <Avatar size={Math.round(getSimpleSize(size) * 0.8)} image={server.icon} />
      <ListItem.Text>{server.name}</ListItem.Text>
      <XStack flex={1} />

      {typeof hasJoined === 'boolean' && (
        <ButtonSimple
          variant="transparent"
          tooltip={size !== 'small' ? '' : hasJoined ? 'Joined!' : 'Join server'}
          tooltipPlacement="left"
          size={size}
          onPress={(e) => {
            toggleJoinServer(server, e)
          }}
          icon={hasJoined ? Check : DoorOpen}
        >
          {size === 'small' || hasJoined ? null : 'Join'}
        </ButtonSimple>
      )}
    </ListItem>
  )

  if (link) {
    return <Link href={`/${server.id}`}>{content}</Link>
  }

  return content
}
