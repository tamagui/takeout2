import { memo } from 'react'
import Svg, { Defs, Path, Text, TextPath } from 'react-native-svg'
import { Circle, styled, useTheme, View } from 'tamagui'
import { isUserOnline } from '~/features/user/isUserOnline'
import { animationClamped } from '~/interface/animations/animationClamped'
import { Avatar } from '~/interface/avatars/Avatar'
import type { UserWithStats } from '~/data/types'

export type UserBubbleProps = {
  user: UserWithStats
  active?: boolean
  circleSize?: number
}

export const UserBubble = memo((props: UserBubbleProps) => {
  const { user, circleSize = 60 } = props
  const { color06 } = useTheme()
  const username = user.username || user.name || ''
  // Add ellipsis for long names - matching web version
  const displayName = username.length > 12 ? username.slice(0, 10) + '…' : username

  // SVG text path configuration with more padding for text visibility
  const padding = 12 // increased padding to prevent text cutoff
  const radius = circleSize / 2 + 5 // slightly further from edge for better visibility
  const textPathId = `text-path-${user.id}`
  const svgSize = circleSize + padding * 2
  const centerX = svgSize / 2
  const centerY = svgSize / 2

  // calculate arc for text - top-left curve
  const angleSpread = 110
  const startAngle = 190
  const endAngle = startAngle + angleSpread

  // convert angles to radians and calculate points
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180

  const startX = centerX + radius * Math.cos(startRad)
  const startY = centerY + radius * Math.sin(startRad)
  const endX = centerX + radius * Math.cos(endRad)
  const endY = centerY + radius * Math.sin(endRad)

  return (
    <View group="item" containerType="normal" p={3} contain="layout">
      {/* background hover effect */}
      <View
        animation={animationClamped('quickerLessBouncy')}
        position="absolute"
        inset={-18}
        y={-5}
        rounded="$6"
        opacity={0}
        scale={0.9}
      />

      <Avatar isOnline={isUserOnline(user)} size={circleSize} image={user.image} />

      <Circle
        position="absolute"
        size={circleSize + 5}
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

      {/* svg for curved text on top-left */}
      <View
        z={100}
        position="absolute"
        width={svgSize}
        height={svgSize}
        pointerEvents="none"
        t={-padding / 1.5}
        l={-padding / 1.5}
      >
        <Svg
          width={svgSize}
          height={svgSize}
          style={{ overflow: 'visible' }}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          <Defs>
            <Path
              id={textPathId}
              d={`
                M ${startX},${startY}
                A ${radius},${radius} 0 0,1 ${endX},${endY}
              `}
            />
          </Defs>
          <Text
            fontSize="8"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="600"
            fill="currentColor"
            textAnchor="start"
            letterSpacing="0.5"
          >
            <TextPath href={`#${textPathId}`} startOffset="5%" color={color06.val}>
              {displayName}
            </TextPath>
          </Text>
        </Svg>
      </View>
    </View>
  )
})

const BackgroundCircle = styled(Circle, {
  fullscreen: true,
  borderStyle: 'solid',
  borderWidth: 0.5,
  borderColor: '$color02',

  '$group-item-hover': {
    borderColor: '$color04',
  },

  '$group-item-press': {
    borderColor: '$color04',
    opacity: 0.8,
  },
})
