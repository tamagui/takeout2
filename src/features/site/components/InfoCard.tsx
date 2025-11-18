import type { ComponentType } from 'react'
import type { ReactNode } from 'react'
import { Card, H5, Paragraph, View, styled } from 'tamagui'
import Glint from '~/interface/effects/Glint'
import type { IconProps } from '~/interface/icons/types'

interface InfoCardProps {
  title: string
  Icon: ComponentType<IconProps>
  children: ReactNode
}

const StyledCard = styled(Card, {
  elevate: true,
  size: '$4',
  rounded: '$6',
  mb: '$2',
  width: '100%',
  animation: '200ms',
  scale: 1,
  bordered: false,
  hoverStyle: {
    scale: 1.02,
  },
  pressStyle: {
    scale: 0.98,
  },

  $md: {
    width: 'calc(50% - 12px)',
    mb: '$4',
  },

  $xl: {
    width: 'calc(32% - 12px)',
    mb: '$4',
  },
})

export const InfoCard = ({ title, Icon, children }: InfoCardProps) => {
  return (
    <StyledCard>
      {/* <Glint rounded="$4" /> */}
      <Card.Header padded gap="$2">
        <View position="absolute" t="$4" r="$4" opacity={0.25}>
          <Icon size={24} />
        </View>

        <H5 fontFamily="$mono" size="$5">
          {title}
        </H5>

        <Paragraph size="$4" color="$color11">
          {children}
        </Paragraph>
      </Card.Header>
    </StyledCard>
  )
}
