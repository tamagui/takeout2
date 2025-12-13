import { SizableText, YStack } from 'tamagui'

import { H1 } from '~/interface/text/Headings'

import type React from 'react'
import type { IconProps } from '~/interface/icons/types'

export const StepContent = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.FC<IconProps>
  title: string
  description: string
}) => {
  return (
    <YStack
      items="center"
      p="$8"
      fullscreen
      mx="auto"
      justify="center"
      animation="100ms"
      exitStyle={{ opacity: 0 }}
      opacity={1}
    >
      <YStack
        animation="lazy"
        y={0}
        enterStyle={{ scale: 0.8, y: -10, opacity: 0 }}
        exitStyle={{ scale: 0.8, y: -10, opacity: 0 }}
        opacity={1}
        scale={1}
      >
        <Icon color="$color9" size={96} />
      </YStack>
      <H1
        mt="$4"
        animation="bouncy"
        y={0}
        enterStyle={{ scale: 0.95, y: 4, opacity: 0 }}
        exitStyle={{ scale: 0.95, y: 4, opacity: 0 }}
        opacity={1}
        scale={1}
        color="$color10"
        text="center"
        fontFamily="$heading"
        fontWeight="700"
        select="none"
      >
        {title}
      </H1>

      <SizableText
        size="$6"
        mx="auto"
        maxW={520}
        animation="bouncy"
        y={0}
        enterStyle={{ scale: 0.95, y: -2, opacity: 0 }}
        exitStyle={{ scale: 0.95, y: -2, opacity: 0 }}
        opacity={1}
        scale={1}
        text="center"
        color="$color11"
        select="none"
      >
        {description}
      </SizableText>
    </YStack>
  )
}
