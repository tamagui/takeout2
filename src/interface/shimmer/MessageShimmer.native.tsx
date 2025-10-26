import { useMemo } from 'react'
import { View, XStack } from 'tamagui'
import { kWidth } from '~/interface/dimensions'
import { CircleShimmer } from './CircleShimmer'
import { LineShimmer } from './LineShimmer'

const getRandomWidth = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min) + min)
}

export const MessageShimmer = ({
  taller,
  average,
}: {
  taller?: boolean
  average?: boolean
}) => {
  const maxWidth = kWidth - 80

  const widths = useMemo(
    () => ({
      first: getRandomWidth(80, Math.min(120, maxWidth)),
      average1: getRandomWidth(150, Math.min(250, maxWidth)),
      taller1: getRandomWidth(200, Math.min(maxWidth * 0.8, maxWidth)),
      taller2: getRandomWidth(180, Math.min(maxWidth * 0.7, maxWidth)),
      last: getRandomWidth(140, Math.min(220, maxWidth)),
    }),
    [maxWidth]
  )

  return (
    <XStack width="100%" gap="$4" px="$4" py="$2">
      <CircleShimmer size={32} />
      <View flex={1} gap="$2">
        <LineShimmer width={widths.first} height={20} />
        {average && (
          <>
            <LineShimmer width={widths.average1} height={20} />
          </>
        )}
        {taller && (
          <>
            <LineShimmer width={widths.taller1} height={20} />
            <LineShimmer width={widths.taller2} height={20} />
          </>
        )}
        <LineShimmer width={widths.last} height={20} />
      </View>
    </XStack>
  )
}
