import { memo } from 'react'
import { Circle, styled, View } from 'tamagui'
import { isUserOnline } from '~/features/user/isUserOnline'
import { animationClamped } from '~/interface/animations/animationClamped'
import { Avatar } from '~/interface/avatars/Avatar'
import type { UserWithStats } from '~/data/types'
import './UserBubble.css'

export type UserBubbleProps = {
  user: UserWithStats
  userServerId?: string
  active?: boolean
}

const circleSize = 58

export const UserBubble = memo((props: UserBubbleProps) => {
  const { user } = props
  const username = user.username || user.name || ''
  const displayName = username.length > 14 ? username.slice(0, 14) + '…' : username
  const chars = displayName.split('')
  const totalChars = chars.length

  return (
    <View group="item" containerType="normal" position="relative" p={3} contain="layout">
      <View cursor="default" items="center" m={-3}>
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
