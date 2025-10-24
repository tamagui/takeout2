import { Plus } from '@tamagui/lucide-icons'
import type { Href } from 'one'
import { memo } from 'react'
import { Circle, ScrollView, styled, XStack, YStack } from 'tamagui'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import { animationClamped } from '../animations/animationClamped'
import { Link } from '../app/Link'
import { Logo } from '../app/Logo'
import { Avatar } from '../avatars/Avatar'
import { dialogCreateServer } from '../dialogs/actions'
import Glint from '../effects/Glint'
import { TooltipSimple } from '../tooltip/TooltipSimple'
import { useUser } from '~/features/user/useUser'
import { isTauri } from '@vxrn/helpers'
import { DownloadAppButton } from '~/features/topbar/DownloadAppButton'

const ServerBubble = ({
  href,
  name,
  image,
  isActive,
  onPress,
  children,
}: {
  href?: Href
  name: string
  image?: string
  children?: React.ReactNode
  isActive?: boolean
  onPress?: () => void
}) => (
  <Link href={href || ''} passThrough={!href || !!onPress}>
    <TooltipSimple label={name}>
      <YStack p={3}>
        <Circle
          size={42}
          cursor="pointer"
          data-testid={`server-${name}`}
          animation={animationClamped('quickestLessBouncy')}
          rounded={100}
          onPress={onPress}
          bg="$color3"
          shadowColor="$shadow2"
          shadowRadius={5}
          shadowOffset={{ height: 3, width: 0 }}
          pressStyle={{
            opacity: 0.5,
          }}
          focusVisibleStyle={{
            outlineStyle: 'solid',
            outlineColor: '$color8',
            outlineWidth: 2,
          }}
          hoverStyle={{
            bg: '$color4',
            outlineWidth: 2,
            outlineStyle: 'solid',
            outlineColor: '$color0075',
          }}
          {...(isActive && {
            outlineWidth: 2,
            outlineColor: '$color0075',
            outlineStyle: 'solid',
          })}
        >
          <Glint bottomShadow rounded={100} />
          {typeof image === 'string' ? <Avatar size={42} image={image} /> : children}
        </Circle>
      </YStack>
    </TooltipSimple>
  </Link>
)

export const SidebarServersRow = memo(() => {
  const activeServerId = useCurrentServerId()
  const { user } = useUser()

  return (
    <YStack className="sidebar-servers-row">
      {!isTauri && (
        <XStack>
          <DownloadAppButton />
        </XStack>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <SidebarIndent flexDirection="row" pb="$1.5">
          <ServerBubble href={`/`} name="Home" isActive={!activeServerId}>
            <Logo size={24} />
          </ServerBubble>

          {user?.servers?.map((server) => {
            return (
              <ServerBubble
                key={server.id}
                href={`/${server.id}`}
                name={server.name}
                image={server.icon}
                isActive={activeServerId === server.id}
              />
            )
          })}

          <ServerBubble
            name="Create or join server"
            onPress={async () => {
              if (await dialogCreateServer()) {
                console.info('created')
              }
            }}
          >
            <Plus opacity={0.5} size={16} />
          </ServerBubble>
        </SidebarIndent>
      </ScrollView>
    </YStack>
  )
})

const SidebarIndent = styled(YStack, {
  px: '$3',
})
