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
  disableBorder?: boolean
  gradient?: boolean
  gradientColors?: string[]
}

export const Avatar = memo(
  ({
    image,
    name,
    size: sizeIn = 28,
    active,
    isOnline,
    disableBorder,
    gradient,
    gradientColors,
    ...rest
  }: AvatarProps) => {
    const size = getSimpleSize(sizeIn)
    const isBig = size > 40
    const scale = isBig ? size / 42 : size / 21

    return (
      <YStack
        pointerEvents="none"
        width={size}
        height={size}
        position="relative"
        rounded={100}
        {...(!disableBorder && {
          outlineColor: '$color02',
          outlineOffset: 1,
          outlineWidth: 0.5,
          outlineStyle: 'solid',
        })}
      >
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
