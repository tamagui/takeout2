import { H5, Paragraph, View, YStack, styled } from 'tamagui'

import type { ComponentType } from 'react'
import type { IconProps } from '~/interface/icons/types'

interface InfoCardProps {
  title: string
  Icon: ComponentType<IconProps>
  children: React.ReactNode
  maxColumns?: 1 | 2 | 3
}

export const InfoCard = ({ title, Icon, children, maxColumns }: InfoCardProps) => {
  return (
    <CardContainer maxColumns={maxColumns}>
      <View self="flex-end" mb={-26} opacity={0.25}>
        <Icon size={26} />
      </View>

      <H5 fontFamily="$mono" size="$5" mt={-10}>
        {title}
      </H5>

      <Paragraph mr="$6" size="$5" color="$color9">
        {children}
      </Paragraph>
    </CardContainer>
  )
}

const CardContainer = styled(YStack, {
  gap: '$2',
  mb: '$2',
  py: '$4',
  px: '$2',
  position: 'relative',

  variants: {
    maxColumns: {
      1: {
        width: '100%',
      },

      2: {
        width: '100%',

        $md: {
          width: 'calc(50% - 12px)',
          mb: '$4',
        },
      },

      3: {
        width: '100%',

        $md: {
          width: 'calc(50% - 12px)',
          mb: '$4',
        },

        $xl: {
          width: 'calc(32% - 12px)',
          mb: '$4',
        },
      },
    },
  } as const,

  defaultVariants: {
    maxColumns: 3,
  },
})
