import type { ComponentType } from 'react'
import { H5, Paragraph, View, YStack, styled } from 'tamagui'
import type { IconProps } from '~/interface/icons/types'

interface InfoCardProps {
  title: string
  Icon: ComponentType<IconProps>
  children: React.ReactNode
}

const CardContainer = styled(YStack, {
  gap: '$2',
  mb: '$2',
  p: '$4',
  position: 'relative',
  width: '100%',

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
    <CardContainer>
      <View self="flex-end" mb={-20} opacity={0.25}>
        <Icon size={24} />
      </View>

      <H5 fontFamily="$mono" size="$5" mt={-10}>
        {title}
      </H5>

      <Paragraph size="$5" color="$color9">
        {children}
      </Paragraph>
    </CardContainer>
  )
}
