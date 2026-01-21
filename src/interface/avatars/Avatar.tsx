import { LinearGradient } from '@tamagui/linear-gradient'
import { memo } from 'react'
import { Circle, styled, YStack, type CircleProps } from 'tamagui'

import { Image } from '~/interface/image/Image'

import { UserIcon } from '../icons/phosphor/UserIcon'
import { getSimpleSize, type SimpleSize } from './sizes'

export type AvatarProps = Omit<CircleProps, 'size'> & {
  image: string | null | undefined
  name?: string
  size?: number | SimpleSize
  active?: boolean
  isOnline?: boolean | null
  gradient?: boolean
  gradientColors?: string[]
}

const DEFAULT_GRADIENT_COLORS = ['#8B5CF6', '#EC4899', '#F59E0B']

export const Avatar = memo(
  ({
    image,
    name,
    size: sizeIn = 28,
    active,
    isOnline,
    gradient,
    gradientColors = DEFAULT_GRADIENT_COLORS,
    ...rest
  }: AvatarProps) => {
    const size = getSimpleSize(sizeIn)
    const isBig = size > 40
    const scale = isBig ? size / 42 : size / 21

    const borderWidth = gradient ? 2 : 0

    const avatarContent = (
      <SelectableCircle
        active={active || false}
        pressable={!!rest.onPress && !active}
        size={size}
        overflow="hidden"
        className={
          typeof isOnline === 'undefined'
            ? ''
            : isBig
              ? 'avatar-cutout-big'
              : 'avatar-cutout-small'
        }
        z={999}
        {...rest}
      >
        {image ? (
          <Image
            src={image}
            alt={name ? `${name}'s avatar` : 'User avatar'}
            width={size}
            height={size}
            objectFit="cover"
          />
        ) : (
          <UserIcon size={size / 2} />
        )}
      </SelectableCircle>
    )

    return (
      <YStack
        pointerEvents="none"
        width={size + borderWidth * 2 + 2}
        height={size + borderWidth * 2 + 2}
        position="relative"
        rounded={100}
        items="center"
        justify="center"
      >
        {gradient ? (
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            width={size + borderWidth * 2 + 2}
            height={size + borderWidth * 2 + 2}
            rounded={100}
            items="center"
            justify="center"
          >
            {avatarContent}
          </LinearGradient>
        ) : (
          avatarContent
        )}

        {typeof isOnline === 'boolean' ? (
          <Circle
            position="absolute"
            b={-1.1 * scale + (isBig ? 4.5 : 0)}
            r={-1.1 * scale + (isBig ? 4.5 : 0)}
            size={7 * scale}
            opacity={1}
            bg={isOnline ? '$green10' : '$color4'}
          />
        ) : null}
      </YStack>
    )
  }
)

const SelectableCircle = styled(Circle, {
  select: 'none',
  bg: '$background02',

  variants: {
    active: {
      true: {
        outlineColor: '#fff',
        outlineWidth: 2,
        outlineStyle: 'solid',

        pressStyle: {
          outlineColor: '#ccc',
        },
      },
    },

    pressable: {
      true: {
        hoverStyle: {
          outlineColor: '$color5',
          outlineWidth: 2,
          outlineStyle: 'solid',
        },

        pressStyle: {
          outlineColor: '#fff',
          outlineWidth: 2,
          outlineStyle: 'solid',
        },
      },
    },
  } as const,
})
