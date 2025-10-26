import { memo } from 'react'
import { AnimatePresence, Circle, SizableText, styled, View, XStack } from 'tamagui'
import { useCurrentChannelId } from '~/context/CurrentChannelContext'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import { formatMentionsToText } from '~/features/message/formatMentionsToText'
import { getMessageLink } from '~/features/message/getMessageLink'
import { isUserOnline } from '~/features/user/isUserOnline'
import { ellipsis } from '@vxrn/helpers'
import { animationClamped } from '~/interface/animations/animationClamped'
import { Link } from '~/interface/app/Link'
import { Avatar } from '~/interface/avatars/Avatar'
import Glint from '~/interface/effects/Glint'
import type { NotificationMessageWithRelations, UserWithStats } from '~/data/types'
import { getPrivateChatLink } from '../getPrivateChatLink'
import { useUser } from '../useUser'
import './UserBubble.css'

export type UserBubbleProps = {
  user: UserWithStats
  userServerId: string
  active?: boolean
  notification?: NotificationMessageWithRelations
}

const circleSize = 58

export const UserBubble = memo((props: UserBubbleProps) => {
  const { user, active } = props
  const username = user.username || user.name || ''
  const displayName = username.length > 14 ? username.slice(0, 14) + '…' : username
  const chars = displayName.split('')
  const totalChars = chars.length
  const serverId = useCurrentServerId()
  const channelId = useCurrentChannelId()

  return (
    <View group="item" containerType="normal" position="relative" p={3} contain="layout">
      <NotificationBubble notification={props.notification} />
      <Link
        asChild
        width={circleSize}
        height={circleSize}
        href={getPrivateChatLink({
          userServerId: props.userServerId,
          serverId,
          channelId,
        })}
      >
        <View cursor="default" tag="a" items="center" m={-3}>
          {/* background */}
          <View
            // this animation actually fixes tuari bug w/glitchy rendering
            animation={animationClamped('quickestLessBouncy')}
            position="absolute"
            inset={-14}
            contain="strict"
            y={-5}
            rounded="$6"
            opacity={0}
            scale={0.9}
            bg="$color1"
            $group-item-hover={{
              opacity: 0.25,
              scale: 1,
              bg: '$color1',
            }}
            // TODO tamagui bug not applying
            // $group-item-press={{
            //   opacity: 1,
            //   bg: '$color1',
            // }}
          />

          <Avatar isOnline={isUserOnline(user)} size={circleSize} image={user.image} />

          {/* <LinearGradient
            contain="paint layout"
            fullscreen
            colors={['$white', '$white0']}
            start={[0, 0]}
            end={[0, 1]}
            rounded={1000}
            overflow="hidden"
            opacity={0.3}
          /> */}

          <Circle
            position="absolute"
            size={circleSize + 25}
            t={-25 / 2}
            items="center"
            justify="center"
            className="avatar-cutout-small-frame"
            contain="strict"
          >
            <Circle
              size={circleSize}
              {...{
                shadowColor: '$shadow5',
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <BackgroundCircle />
            </Circle>
          </Circle>

          {/* css circular text */}
          <div
            className="text-ring"
            style={
              { '--total': totalChars, top: '50%', left: '50%' } as React.CSSProperties
            }
          >
            <span className="text-ring-chars" aria-hidden="true">
              {chars.map((char, index) => (
                <span key={index} style={{ '--index': index } as React.CSSProperties}>
                  {char}
                </span>
              ))}
            </span>
            <span className="sr-only">{username}</span>
          </div>
        </View>
      </Link>
    </View>
  )
})

const BackgroundCircle = styled(Circle, {
  fullscreen: true,
  borderStyle: 'solid',
  borderWidth: 0.5,
  borderColor: '$color02',
  opacity: 0.5,

  '$group-item-hover': {
    borderColor: '$color04',
  },

  '$group-item-press': {
    borderColor: '$color04',
    opacity: 0.8,
  },
})

const NotificationBubble = memo(
  ({ notification }: { notification?: NotificationMessageWithRelations }) => {
    const { user } = useUser()
    const message = notification?.messages?.[0]

    return (
      <AnimatePresence>
        {notification && !notification.seenAt && message && (
          <Link href={getMessageLink(message)}>
            <XStack
              animation={animationClamped('quickLessBouncy')}
              animateOnly={['transform']}
              position="absolute"
              t={19}
              l={-10}
              backdropFilter="blur(10px)"
              py={6}
              px={7}
              maxW="93%"
              maxH={55}
              overflow="hidden"
              rounded={14}
              shadowColor="$shadow4"
              shadowRadius={5}
              shadowOffset={{ height: 4, width: 0 }}
              z={1000000}
              $theme-light={{
                bg: '$white04',
              }}
              $theme-dark={{
                bg: '$shadow4',
              }}
              enterStyle={{
                opacity: 0,
                y: -5,
              }}
              exitStyle={{
                opacity: 0,
                y: -5,
              }}
              hoverStyle={{
                outlineWidth: 2,
                outlineColor: '$white02',
                outlineStyle: 'solid',
                scale: 1.04,
              }}
              pressStyle={{
                scale: 0.9,
              }}
            >
              <Glint rounded={14} bottomShadow />

              <SizableText
                color="$color12"
                opacity={0.8}
                fontWeight="500"
                fontSize={10}
                lineHeight={13}
                numberOfLines={2}
                $theme-dark={{
                  opacity: 0.6,
                }}
              >
                {ellipsis(
                  formatMentionsToText(notification.messages?.[0]?.content || '').replace(
                    `@${user?.username}`,
                    ''
                  ),
                  30
                )}
              </SizableText>
            </XStack>
          </Link>
        )}
      </AnimatePresence>
    )
  }
)
